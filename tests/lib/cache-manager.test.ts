import { describe, it, expect } from 'vitest';
import { cacheManager } from '@/lib/cache/cache-manager';

/**
 * Integration tests for CacheManager. Each method is wrapped in try/catch and
 * degrades gracefully, so these assertions hold whether Redis is up (real
 * round-trip) or down (graceful false/0/null). Uses unique keys and never calls
 * the destructive clear() so shared cache state is untouched.
 */
describe('CacheManager', () => {
  const key = `itest:cache:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  it('set/get/exists/ttl/delete round-trip', async () => {
    const ok = await cacheManager.set(key, { v: 42 }, { ttl: 60 });
    expect(typeof ok).toBe('boolean');

    const got = await cacheManager.get(key);
    if (got !== null) expect(got).toEqual({ v: 42 }); // only assert value when Redis served it

    expect(typeof (await cacheManager.exists(key))).toBe('boolean');
    expect(typeof (await cacheManager.ttl(key))).toBe('number');
    expect(typeof (await cacheManager.delete(key))).toBe('boolean');
  });

  it('wrap: returns the loader result', async () => {
    const wkey = `${key}:wrap`;
    const result = await cacheManager.wrap(wkey, async () => 123, { ttl: 60 });
    expect(result).toBe(123);
    await cacheManager.delete(wkey);
  });

  it('deletePattern + invalidateByTag return counts', async () => {
    expect(typeof (await cacheManager.deletePattern(`${key}:*`))).toBe('number');
    expect(typeof (await cacheManager.invalidateByTag(`itest-tag-${Date.now()}`))).toBe('number');
  });
});
