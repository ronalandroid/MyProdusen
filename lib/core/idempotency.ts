import { NextRequest } from 'next/server';
import { getRedisClient, isRedisConfigured } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';

/**
 * Validates and locks an idempotency key to prevent double submissions.
 * Returns true if the key is new (lock acquired), false if already processed.
 *
 * Fails OPEN whenever Redis is unavailable — a missing/broken cache must never
 * hard-fail a clock-in. This is critical during an outage (Redis down but app
 * up) which is exactly when the offline queue replays keyed submits: without
 * fail-open every check-in/out would 500. getRedisClient() THROWS when
 * REDIS_URL is unset, so the guard + try/catch must wrap it, not just its result.
 */
export async function acquireIdempotencyLock(request: NextRequest, ttlSeconds = 86400): Promise<boolean> {
  const idempotencyKey = request.headers.get('idempotency-key');

  if (!idempotencyKey) {
    // If client doesn't provide a key, we bypass idempotency check.
    return true;
  }

  if (!isRedisConfigured()) {
    logger.warn('Redis is not configured. Bypassing idempotency check.');
    return true;
  }

  const cacheKey = `idempotency:${idempotencyKey}`;

  try {
    const redis = getRedisClient();
    // NX: set only if absent; EX: expire in seconds.
    // 'OK' → new request (lock acquired); null → duplicate.
    const result = await redis.set(cacheKey, 'locked', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (error) {
    logger.error('Failed to acquire idempotency lock', error);
    // Fail open if Redis errors out, so we don't break the app.
    return true;
  }
}
