import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { setAuthCookieOnResponse } from '@/lib/auth-response';

describe('setAuthCookieOnResponse', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('keeps auth cookie secure in production by default', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TESTSPRITE_DISABLE_SECURE_COOKIES', 'false');
    const response = setAuthCookieOnResponse(NextResponse.json({ ok: true }), 'token');
    expect(response.headers.get('set-cookie')).toContain('Secure');
  });

  it('does not allow TestSprite to disable secure auth cookie in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TESTSPRITE_DISABLE_SECURE_COOKIES', 'true');
    const response = setAuthCookieOnResponse(NextResponse.json({ ok: true }), 'token');
    expect(response.headers.get('set-cookie')).toContain('Secure');
  });
});
