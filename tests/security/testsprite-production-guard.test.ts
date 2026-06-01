import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const loginRoute = readFileSync('app/api/auth/login/route.ts', 'utf8');

describe('TestSprite compatibility production guard', () => {
  it('does not create TestSprite credentials in production', () => {
    expect(loginRoute).toContain("if (process.env.NODE_ENV === 'production')");
    expect(loginRoute).toContain("process.env.TESTSPRITE_COMPAT_RESPONSE !== 'true'");
  });

  it('does not emit TestSprite compatibility response shape in production', () => {
    expect(loginRoute).toContain("process.env.NODE_ENV !== 'production' && process.env.TESTSPRITE_COMPAT_RESPONSE === 'true'");
    expect(loginRoute).not.toContain("const response = process.env.TESTSPRITE_COMPAT_RESPONSE === 'true'");
  });
});
