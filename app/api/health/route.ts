import { promises as fs } from 'fs';
import { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { isRedisConfigured, pingRedis } from '@/lib/cache/redis';
import { cacheMetrics } from '@/lib/cache/cache-metrics';
import { getAllCircuitBreakers } from '@/lib/resilience/circuit-breaker';

export const runtime = 'nodejs';

type CheckStatus = 'ok' | 'error';
const OPTIONAL_REDIS_TIMEOUT_MS = 1500;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

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

  if (!isRedisConfigured()) {
    return {
      status: 'ok' as CheckStatus,
      responseTimeMs: Date.now() - startedAt,
      optional: true,
      configured: false,
    };
  }

  try {
    const isHealthy = await withTimeout(pingRedis(), OPTIONAL_REDIS_TIMEOUT_MS);

    return {
      status: 'ok' as CheckStatus,
      responseTimeMs: Date.now() - startedAt,
      optional: true,
      configured: true,
      reachable: isHealthy,
    };
  } catch (error) {
    return {
      status: 'ok' as CheckStatus,
      responseTimeMs: Date.now() - startedAt,
      optional: true,
      configured: true,
      reachable: false,
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

function publicCheck(check: { status: CheckStatus }) {
  return { status: check.status };
}

function publicRedisCheck(check: { status: CheckStatus; optional?: boolean; configured?: boolean; reachable?: boolean }) {
  return {
    status: check.status,
    optional: true,
    configured: Boolean(check.configured),
    reachable: check.reachable === true,
  };
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

function getAppMetadata() {
  return {
    name: 'MyProdusen',
    status: 'ok' as CheckStatus,
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    commit: process.env.GIT_COMMIT_SHA || process.env.COOLIFY_GIT_COMMIT_SHA || 'unknown',
    buildTime: process.env.BUILD_TIME || process.env.COOLIFY_BUILD_TIME || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
  };
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
      app: getAppMetadata(),
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      checks: {
        database: publicCheck(database),
        redis: publicRedisCheck(redis),
        disk: publicCheck(disk),
        memory: publicCheck(memory),
      },
      cache: {
        status: cache.errors > 0 ? 'error' : 'ok',
      },
      circuitBreakers: Object.fromEntries(
        Object.entries(circuitBreakers).map(([name, breaker]) => [
          name,
          { status: breaker.state === 'OPEN' ? 'error' : 'ok' },
        ])
      ),
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, private',
      },
    }
  );
}
