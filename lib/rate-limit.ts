/**
 * Rate Limit Module - Wrapper for rate-limiter with Next.js integration
 */

import { NextRequest } from 'next/server';
import { rateLimiter, RATE_LIMIT_PRESETS, getRateLimitKey, checkRateLimit } from './rate-limiter';
import { getClientIp } from './middleware';

export const RATE_LIMITS = {
  LOGIN: RATE_LIMIT_PRESETS.LOGIN,
  PASSWORD_RESET: RATE_LIMIT_PRESETS.PASSWORD_RESET,
  REGISTRATION: RATE_LIMIT_PRESETS.REGISTRATION,
  API_GENERAL: RATE_LIMIT_PRESETS.API_GENERAL,
  API_STRICT: RATE_LIMIT_PRESETS.API_STRICT,
  ATTENDANCE: RATE_LIMIT_PRESETS.ATTENDANCE,
};

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  headers: Record<string, string>;
}

function isRateLimitBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return (
    process.env.NODE_ENV === 'test' ||
    process.env.TESTSPRITE_DISABLE_RATE_LIMITS === 'true' ||
    process.env.E2E_DISABLE_RATE_LIMITS === 'true'
  );
}

/**
 * Apply rate limiting to a Next.js request
 */
export async function rateLimit(
  request: NextRequest,
  config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS],
  identifier?: string
): Promise<RateLimitResult> {
  if (isRateLimitBypassEnabled()) {
    return { limited: false, remaining: 999, resetAt: Date.now() + 60_000, headers: {} };
  }

  const ip = getClientIp(request);
  const pathname = request.nextUrl?.pathname || new URL(request.url).pathname || 'api';
  const key = getRateLimitKey(ip, identifier || pathname);
  
  const result = checkRateLimit(key, config);
  
  return {
    limited: !result.allowed,
    remaining: parseInt(result.headers['X-RateLimit-Remaining']),
    resetAt: new Date(result.headers['X-RateLimit-Reset']).getTime(),
    retryAfter: result.headers['Retry-After'] ? parseInt(result.headers['Retry-After']) : undefined,
    headers: result.headers,
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(ip: string, identifier: string): void {
  const key = getRateLimitKey(ip, identifier);
  rateLimiter.reset(key);
}

/**
 * Record successful request (decrements counter)
 */
export function recordSuccess(ip: string, identifier: string): void {
  const key = getRateLimitKey(ip, identifier);
  rateLimiter.recordSuccess(key);
}
