import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { isTestSpriteCompatEnabled } from '@/lib/testsprite';

const loginRoute = readFileSync('app/api/auth/login/route.ts', 'utf8');

describe('TestSprite compatibility production guard', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('does not create TestSprite credentials in production', () => {
    expect(loginRoute).toContain("if (process.env.NODE_ENV === 'production')");
    expect(loginRoute).toContain("process.env.TESTSPRITE_COMPAT_RESPONSE !== 'true'");
  });

  it('centralizes TestSprite compatibility behind production guard', () => {
    expect(loginRoute).toContain('isTestSpriteCompatEnabled()');
    expect(loginRoute).not.toContain("const response = process.env.TESTSPRITE_COMPAT_RESPONSE === 'true'");
  });

  it('disables TestSprite compatibility in production even when enabled', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TESTSPRITE_COMPAT_RESPONSE', 'true');

    expect(isTestSpriteCompatEnabled()).toBe(false);
  });
});
