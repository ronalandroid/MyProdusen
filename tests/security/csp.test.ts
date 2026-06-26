import { describe, it, expect } from 'vitest';
import { generateNonce, buildReportOnlyCsp } from '@/lib/security/csp';

describe('generateNonce', () => {
  it('returns a base64 nonce', () => {
    expect(generateNonce()).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });

  it('is unique per call', () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });
});

describe('buildReportOnlyCsp', () => {
  const nonce = 'abc123==';

  it('puts the per-request nonce in script-src', () => {
    expect(buildReportOnlyCsp(nonce, { isProd: true })).toContain(`'nonce-${nonce}'`);
  });

  it('drops unsafe-inline and unsafe-eval from script-src (the point of the preview)', () => {
    const csp = buildReportOnlyCsp(nonce, { isProd: true });
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src')) ?? '';
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
    expect(scriptSrc).toContain("'strict-dynamic'");
  });

  it('keeps the documented style-src unsafe-inline tradeoff', () => {
    expect(buildReportOnlyCsp(nonce, { isProd: true })).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('locks down object-src and frame-ancestors', () => {
    const csp = buildReportOnlyCsp(nonce, { isProd: true });
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('adds upgrade-insecure-requests only in production', () => {
    expect(buildReportOnlyCsp(nonce, { isProd: true })).toContain('upgrade-insecure-requests');
    expect(buildReportOnlyCsp(nonce, { isProd: false })).not.toContain('upgrade-insecure-requests');
  });
});
