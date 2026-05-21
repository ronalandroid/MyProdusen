import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCanonicalAppUrl } from '@/lib/app-url';

describe('getCanonicalAppUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers canonical APP_URL over public localhost env', () => {
    vi.stubEnv('APP_URL', 'https://myprodusen.online/');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

    expect(getCanonicalAppUrl()).toBe('https://myprodusen.online');
  });

  it('uses request origin fallback when no app env exists', () => {
    vi.stubEnv('APP_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');

    expect(getCanonicalAppUrl('https://myprodusen.online/')).toBe('https://myprodusen.online');
  });
});
