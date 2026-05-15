/**
 * Rate Limiter Module
 * Prevents brute force attacks and API abuse
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
  skipSuccessfulRequests?: boolean;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Check if request should be rate limited
   */
  public check(
    key: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
    const now = Date.now();
    let entry = this.store.get(key);

    // Check if blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    // Initialize or reset if window expired
    if (!entry || entry.resetAt <= now) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      this.store.set(key, entry);
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      // Block if configured
      if (config.blockDurationMs) {
        entry.blockedUntil = now + config.blockDurationMs;
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: config.blockDurationMs 
          ? Math.ceil(config.blockDurationMs / 1000)
          : Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Record successful request (for skipSuccessfulRequests)
   */
  public recordSuccess(key: string): void {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  /**
   * Reset rate limit for a key
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now && (!entry.blockedUntil || entry.blockedUntil <= now)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy rate limiter
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Preset configurations
export const RATE_LIMIT_PRESETS = {
  // Login: 5 attempts per 15 minutes, block for 15 minutes after
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    blockDurationMs: 15 * 60 * 1000,
  },
  
  // Password reset: 3 attempts per hour
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    blockDurationMs: 60 * 60 * 1000,
  },
  
  // Registration: 3 per hour per IP
  REGISTRATION: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  },
  
  // API general: 100 requests per minute
  API_GENERAL: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  
  // API strict: 20 requests per minute
  API_STRICT: {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
  
  // Attendance check-in: 5 per hour (prevent spam)
  ATTENDANCE: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  },
};

/**
 * Generate rate limit key from IP and identifier
 */
export function getRateLimitKey(ip: string, identifier: string): string {
  return `${ip}:${identifier}`;
}

/**
 * Helper to check rate limit and return appropriate response
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; headers: Record<string, string>; error?: string } {
  const result = rateLimiter.check(key, config);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return {
    allowed: result.allowed,
    headers,
    error: result.allowed 
      ? undefined 
      : `Terlalu banyak percobaan. Coba lagi dalam ${result.retryAfter} detik.`,
  };
}
