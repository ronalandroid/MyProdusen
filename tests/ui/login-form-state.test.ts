import { describe, expect, it } from 'vitest';
import { isLoginSubmitDisabled } from '@/lib/forms/login-form-state';

describe('login submit button state', () => {
  it('stays clickable while idle so browser autofill can submit credentials', () => {
    expect(isLoginSubmitDisabled(false)).toBe(false);
  });

  it('disables only during submission to prevent duplicate login requests', () => {
    expect(isLoginSubmitDisabled(true)).toBe(true);
  });
});
