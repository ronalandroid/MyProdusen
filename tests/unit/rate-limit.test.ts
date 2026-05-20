import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

function makeRequest(path = '/api/auth/login') {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
    },
  });
}

describe('rateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('enforces login limit by default outside test bypass mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TESTSPRITE_DISABLE_RATE_LIMITS', 'false');

    const request = makeRequest();
    let result = await rateLimit(request, RATE_LIMITS.LOGIN, 'login:default-enforced');

    for (let attempt = 0; attempt < RATE_LIMITS.LOGIN.maxRequests; attempt++) {
      result = await rateLimit(request, RATE_LIMITS.LOGIN, 'login:default-enforced');
    }

    expect(result.limited).toBe(true);
  });

  it('bypasses login limit when TestSprite disables rate limits explicitly', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TESTSPRITE_DISABLE_RATE_LIMITS', 'true');

    const request = makeRequest();
    let result = await rateLimit(request, RATE_LIMITS.LOGIN, 'login:testsprite-bypass');

    for (let attempt = 0; attempt < RATE_LIMITS.LOGIN.maxRequests + 3; attempt++) {
      result = await rateLimit(request, RATE_LIMITS.LOGIN, 'login:testsprite-bypass');
    }

    expect(result.limited).toBe(false);
    expect(result.remaining).toBe(999);
  });
});
