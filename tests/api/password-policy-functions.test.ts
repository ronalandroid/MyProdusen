import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  getPasswordStrength,
  generateStrongPassword,
} from '@/lib/password-policy';

describe('validatePassword', () => {
  it('accepts a strong password under the default policy', () => {
    const r = validatePassword('Abcd1234!@');
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('flags a too-short password', () => {
    expect(validatePassword('Ab1!').errors.join(' ')).toContain('minimal 8 karakter');
  });

  it('flags a missing uppercase letter', () => {
    expect(validatePassword('abcd1234!@').errors.join(' ')).toContain('huruf besar');
  });

  it('flags a missing lowercase letter', () => {
    expect(validatePassword('ABCD1234!@').errors.join(' ')).toContain('huruf kecil');
  });

  it('flags a missing number', () => {
    expect(validatePassword('Abcdefg!@').errors.join(' ')).toContain('angka');
  });

  it('flags a missing special character', () => {
    expect(validatePassword('Abcd12345').errors.join(' ')).toContain('karakter spesial');
  });

  it('flags a common password', () => {
    // 'passw0rd' is in the embedded common list (lower-cased match)
    expect(validatePassword('passw0rd').errors.join(' ')).toContain('terlalu umum');
  });

  it('honours a relaxed policy (only length + common checks)', () => {
    const relaxed = {
      minLength: 4,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      preventCommonPasswords: false,
    };
    const r = validatePassword('abcd', relaxed);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });
});

describe('getPasswordStrength', () => {
  it('rates a long, mixed password at the max of 4', () => {
    expect(getPasswordStrength('Abcd1234!@')).toBe(4);
  });

  it('penalises an all-numeric password to 0', () => {
    expect(getPasswordStrength('12345678')).toBe(0);
  });

  it('penalises an all-alphabetic password', () => {
    expect(getPasswordStrength('abcdefgh')).toBe(0);
  });

  it('forces a common password to 0', () => {
    expect(getPasswordStrength('password')).toBe(0);
  });

  it('gives a mid score to a short mixed password', () => {
    expect(getPasswordStrength('Abcdef1')).toBe(2);
  });
});

describe('generateStrongPassword', () => {
  it('produces a 16-char password with all character classes by default', () => {
    const pw = generateStrongPassword();
    expect(pw).toHaveLength(16);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[0-9]/);
    expect(pw).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
  });

  it('honours a custom length', () => {
    expect(generateStrongPassword(24)).toHaveLength(24);
  });

  it('passes its own validation policy', () => {
    expect(validatePassword(generateStrongPassword()).valid).toBe(true);
  });
});
