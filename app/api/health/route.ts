import { promises as fs } from 'fs';
import { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { pingRedis } from '@/lib/cache/redis';
import { cacheMetrics } from '@/lib/cache/cache-metrics';
import { getAllCircuitBreakers } from '@/lib/resilience/circuit-breaker';

export const runtime = 'nodejs';

type CheckStatus = 'ok' | 'error';

async function checkDatabase() {
  const startedAt = Date.now();

  try {
    await db.execute(sql`SELECT 1`);

    return {
      status: 'ok' as CheckStatus,
      responseTimeMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: 'error' as CheckStatus,
      responseTimeMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

async function checkRedis() {
  const startedAt = Date.now();

  try {
    const isHealthy = await pingRedis();

    return {
      status: (isHealthy ? 'ok' : 'error') as CheckStatus,
      responseTimeMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: 'error' as CheckStatus,
      responseTimeMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}

async function checkDisk() {
  try {
    await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
    const stats = await fs.statfs(env.UPLOAD_DIR);
    const freeBytes = stats.bavail * stats.bsize;
    const totalBytes = stats.blocks * stats.bsize;

    return {
      status: 'ok' as CheckStatus,
      uploadDir: env.UPLOAD_DIR,
      freeBytes,
      totalBytes,
      usedPercent: totalBytes > 0 ? Math.round(((totalBytes - freeBytes) / totalBytes) * 100) : null,
    };
  } catch (error) {
    return {
      status: 'error' as CheckStatus,
      uploadDir: env.UPLOAD_DIR,
      error: error instanceof Error ? error.message : 'Unknown disk error',
    };
  }
}

function checkMemory() {
  const memory = process.memoryUsage();

  return {
    status: 'ok' as CheckStatus,
    rssBytes: memory.rss,
    heapUsedBytes: memory.heapUsed,
    heapTotalBytes: memory.heapTotal,
    externalBytes: memory.external,
  };
}

function getCacheMetrics() {
  return cacheMetrics.getMetrics();
}

function getCircuitBreakerStats() {
  const breakers = getAllCircuitBreakers();
  const stats: Record<string, any> = {};

  breakers.forEach((breaker, name) => {
    stats[name] = breaker.getStats();
  });

  return stats;
}

export async function GET(_request: NextRequest) {
  const startedAt = Date.now();
  const [database, redis, disk] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkDisk(),
  ]);
  const memory = checkMemory();
  const cache = getCacheMetrics();
  const circuitBreakers = getCircuitBreakerStats();

  const status: CheckStatus =
    database.status === 'ok' && redis.status === 'ok' && disk.status === 'ok'
      ? 'ok'
      : 'error';

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      checks: {
        database,
        redis,
        disk,
        memory,
      },
      cache,
      circuitBreakers,
    },
    { status: status === 'ok' ? 200 : 503 }
  );
}
