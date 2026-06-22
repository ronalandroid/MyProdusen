import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { checkPasswordCompromised } from '@/lib/password-policy';

// A password that is NOT in the embedded common-password list, so the function
// proceeds to the (mocked) HIBP range lookup.
const UNIQUE_PW = 'Sup3rUnique!Pass#2026';

function hibpSuffix(pw: string): string {
  return createHash('sha1').update(pw).digest('hex').toUpperCase().slice(5);
}

// The implementation skips the network call when VITEST is set; stub it off here
// so these tests actually exercise the HIBP range logic against a mocked fetch.
beforeEach(() => {
  vi.stubEnv('VITEST', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('checkPasswordCompromised (HIBP, fail-open)', () => {
  it('flags an embedded common password without any network call', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await checkPasswordCompromised('password123')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('flags a password whose hash suffix is present in the range response', async () => {
    const body = `${hibpSuffix(UNIQUE_PW)}:42\n00000000000000000000000000000000001:1`;
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => body })));
    expect(await checkPasswordCompromised(UNIQUE_PW)).toBe(true);
  });

  it('returns false when the suffix is absent from the range response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => '0000000000000000000000000000000000A:3' })));
    expect(await checkPasswordCompromised(UNIQUE_PW)).toBe(false);
  });

  it('treats a present suffix with a zero count as not compromised', async () => {
    const body = `${hibpSuffix(UNIQUE_PW)}:0`;
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => body })));
    expect(await checkPasswordCompromised(UNIQUE_PW)).toBe(false);
  });

  it('fails open (false) on a non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, text: async () => '' })));
    expect(await checkPasswordCompromised(UNIQUE_PW)).toBe(false);
  });

  it('fails open (false) on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    expect(await checkPasswordCompromised(UNIQUE_PW)).toBe(false);
  });

  it('only sends the SHA-1 prefix to HIBP (k-anonymity), never the password', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200, text: async () => '' }));
    vi.stubGlobal('fetch', fetchSpy);
    await checkPasswordCompromised(UNIQUE_PW);
    const url = String(fetchSpy.mock.calls[0][0]);
    const sha1 = createHash('sha1').update(UNIQUE_PW).digest('hex').toUpperCase();
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`);
    expect(url).not.toContain(UNIQUE_PW);
    expect(url).not.toContain(sha1.slice(5)); // suffix must NOT be in the URL
  });
});
