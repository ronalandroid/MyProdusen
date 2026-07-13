import { afterEach, describe, expect, it, vi } from 'vitest';

function requestWithKey(key?: string) {
  const headers = new Map<string, string>();
  if (key) headers.set('idempotency-key', key);
  return { headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null } } as any;
}

describe('acquireIdempotencyLock fail-open', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('bypasses (returns true) with no key', async () => {
    const { acquireIdempotencyLock } = await import('@/lib/core/idempotency');
    expect(await acquireIdempotencyLock(requestWithKey())).toBe(true);
  });

  it('fails OPEN when Redis is not configured — must NOT throw (would 500 every check-in)', async () => {
    vi.doMock('@/lib/cache/redis', () => ({
      isRedisConfigured: () => false,
      getRedisClient: () => { throw new Error('REDIS_URL is not configured'); },
    }));
    const { acquireIdempotencyLock } = await import('@/lib/core/idempotency');
    await expect(acquireIdempotencyLock(requestWithKey('k-1'))).resolves.toBe(true);
  });

  it('fails OPEN when the Redis client throws at call time', async () => {
    vi.doMock('@/lib/cache/redis', () => ({
      isRedisConfigured: () => true,
      getRedisClient: () => { throw new Error('connection refused'); },
    }));
    const { acquireIdempotencyLock } = await import('@/lib/core/idempotency');
    await expect(acquireIdempotencyLock(requestWithKey('k-2'))).resolves.toBe(true);
  });

  it('returns true on first key, false on duplicate when Redis works', async () => {
    const store = new Set<string>();
    vi.doMock('@/lib/cache/redis', () => ({
      isRedisConfigured: () => true,
      getRedisClient: () => ({
        set: async (key: string, _v: string, _ex: string, _ttl: number, _nx: string) => {
          if (store.has(key)) return null;
          store.add(key);
          return 'OK';
        },
      }),
    }));
    const { acquireIdempotencyLock } = await import('@/lib/core/idempotency');
    expect(await acquireIdempotencyLock(requestWithKey('dup'))).toBe(true);
    expect(await acquireIdempotencyLock(requestWithKey('dup'))).toBe(false);
  });
});
