import { describe, expect, it } from 'vitest';
import { isLoginSubmitDisabled } from '@/lib/forms/login-form-state';

describe('login submit button state', () => {
  it('stays disabled while required credentials are empty', () => {
    expect(isLoginSubmitDisabled(false)).toBe(true);
    expect(isLoginSubmitDisabled(false, 'admin@myprodusen.com', '')).toBe(true);
    expect(isLoginSubmitDisabled(false, '   ', 'LocalAdminPass123!')).toBe(true);
  });

  it('enables when credentials are present', () => {
    expect(isLoginSubmitDisabled(false, 'admin@myprodusen.com', 'LocalAdminPass123!')).toBe(false);
  });

  it('disables only during submission to prevent duplicate login requests', () => {
    expect(isLoginSubmitDisabled(true, 'admin@myprodusen.com', 'LocalAdminPass123!')).toBe(true);
  });
});
