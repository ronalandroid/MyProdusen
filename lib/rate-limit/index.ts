import { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/middleware';
import { RedisRateLimiter } from '@/lib/resilience/rate-limiter-redis';
import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const rateLimiters = new Map<string, RedisRateLimiter>();

function getRateLimiter(config: RateLimitConfig): RedisRateLimiter {
  const key = `${config.maxAttempts}:${config.windowMs}`;
  
  if (!rateLimiters.has(key)) {
    rateLimiters.set(
      key,
      new RedisRateLimiter({
        maxRequests: config.maxAttempts,
        windowMs: config.windowMs,
      })
    );
  }
  
  return rateLimiters.get(key)!;
}

/**
 * Redis-based rate limiter middleware
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns rate limit status with remaining attempts and reset time
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
  if (process.env.NODE_ENV === 'test') {
    return {
      limited: false,
      remaining: config.maxAttempts,
      resetAt: Date.now() + config.windowMs,
    };
  }

  try {
    const ip = getClientIp(request);
    const identifier = `${ip}:${request.nextUrl.pathname}`;
    
    const limiter = getRateLimiter(config);
    const result = await limiter.checkLimit(identifier);

    return {
      limited: !result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt.getTime(),
    };
  } catch (error) {
    logger.error('Rate limit check failed, allowing request', { error });
    return {
      limited: false,
      remaining: config.maxAttempts,
      resetAt: Date.now() + config.windowMs,
    };
  }
}

/**
 * Clear rate limit for a specific IP and path
 */
export async function clearRateLimit(ip: string, path: string): Promise<void> {
  try {
    const identifier = `${ip}:${path}`;
    const limiter = getRateLimiter(RATE_LIMITS.LOGIN);
    await limiter.reset(identifier);
  } catch (error) {
    logger.error('Failed to clear rate limit', { ip, path, error });
  }
}

/**
 * Predefined rate limit configs
 */
export const RATE_LIMITS = {
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  REGISTER: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  PASSWORD_CHANGE: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  API_DEFAULT: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;
