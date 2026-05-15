import { getRedisClient } from '../cache/redis';
import { logger } from '../logger';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  total: number;
}

export class RedisRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const redis = getRedisClient();
      const now = Date.now();
      const windowStart = now - this.config.windowMs;
      const key = `rate-limit:${identifier}`;

      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.zcard(key);
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Pipeline execution failed');
      }

      const count = results[2][1] as number;
      const allowed = count <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - count);
      const resetAt = new Date(now + this.config.windowMs);

      return {
        allowed,
        remaining,
        resetAt,
        total: this.config.maxRequests,
      };
    } catch (error) {
      logger.error('Rate limiter error', { identifier, error });
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: new Date(Date.now() + this.config.windowMs),
        total: this.config.maxRequests,
      };
    }
  }

  async reset(identifier: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = `rate-limit:${identifier}`;
      await redis.del(key);
    } catch (error) {
      logger.error('Rate limiter reset error', { identifier, error });
    }
  }
}

export function createRateLimiter(config: RateLimitConfig): RedisRateLimiter {
  return new RedisRateLimiter(config);
}

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});
