export function isTestSpriteCompatEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.TESTSPRITE_COMPAT_RESPONSE === 'true';
}

export function isTestSpriteRateLimitBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.TESTSPRITE_DISABLE_RATE_LIMITS === 'true';
}

export function isE2ERateLimitBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.E2E_DISABLE_RATE_LIMITS === 'true';
}
