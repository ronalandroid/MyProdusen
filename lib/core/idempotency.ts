import { NextRequest } from 'next/server';
import { AppError } from './app-error';
import { getRedisClient } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';

/**
 * Validates and locks an idempotency key to prevent double submissions.
 * Returns true if the key is new (lock acquired), false if already processed.
 */
export async function acquireIdempotencyLock(request: NextRequest, ttlSeconds = 86400): Promise<boolean> {
  const idempotencyKey = request.headers.get('idempotency-key');
  
  if (!idempotencyKey) {
    // If client doesn't provide a key, we bypass idempotency check.
    // For critical paths, you might want to throw AppError.validation('Idempotency-Key header required');
    return true; 
  }

  const redis = getRedisClient();

  // If redis is not available, we fail open (allow request) but log a warning.
  if (!redis) {
    logger.warn('Redis is unavailable. Bypassing idempotency check.');
    return true;
  }

  const cacheKey = `idempotency:${idempotencyKey}`;
  
  try {
    // NX: Set only if it does not exist
    // EX: Set expiration in seconds
    const result = await redis.set(cacheKey, 'locked', 'EX', ttlSeconds, 'NX');
    
    // result is 'OK' if the key was set (meaning it's a new request)
    // result is null if the key already exists (duplicate request)
    return result === 'OK';
  } catch (error) {
    logger.error('Failed to acquire idempotency lock', error);
    // Fail open if Redis errors out, so we don't break the app
    return true;
  }
}
