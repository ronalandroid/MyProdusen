import { describe, expect, it } from 'vitest';
import { isTrustedMutationOrigin } from '@/lib/security/csrf-origin';

describe('CSRF mutation origin guard', () => {
  it('allows safe methods without origin checks', () => {
    expect(isTrustedMutationOrigin({ method: 'GET', requestUrl: 'https://app.test/api/profile' })).toBe(true);
    expect(isTrustedMutationOrigin({ method: 'HEAD', requestUrl: 'https://app.test/api/profile' })).toBe(true);
  });

  it('allows same-origin mutating requests', () => {
    expect(isTrustedMutationOrigin({
      method: 'POST',
      requestUrl: 'https://myprodusen.online/api/leave',
      origin: 'https://myprodusen.online',
    })).toBe(true);
  });

  it('allows configured app origin for proxied production requests', () => {
    expect(isTrustedMutationOrigin({
      method: 'PATCH',
      requestUrl: 'http://internal:3000/api/employees/1',
      origin: 'https://myprodusen.online',
      appUrl: 'https://myprodusen.online',
    })).toBe(true);
  });

  it('rejects cross-site mutating requests', () => {
    expect(isTrustedMutationOrigin({
      method: 'POST',
      requestUrl: 'https://myprodusen.online/api/leave',
      origin: 'https://evil.example',
    })).toBe(false);
  });

  it('rejects mutating browser requests without origin or referer', () => {
    expect(isTrustedMutationOrigin({
      method: 'DELETE',
      requestUrl: 'https://myprodusen.online/api/employees/1',
    })).toBe(false);
  });
});
