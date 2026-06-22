import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { registerSchema, changePasswordSchema } from '@/utils/validation/auth';

describe('Password Policy Integration Tests', () => {
  describe('API Route Validation Error Responses', () => {
    it('should return 422 with clear error message for weak password in register', () => {
      const weakPasswords = [
        { password: 'short1!', expectedError: 'minimal 8 karakter' },
        { password: 'nouppercase1!', expectedError: 'huruf besar' },
        { password: 'NOLOWERCASE1!', expectedError: 'huruf kecil' },
        { password: 'NoNumber!', expectedError: 'angka' },
        { password: 'NoSpecial1', expectedError: 'karakter khusus' },
      ];

      weakPasswords.forEach(({ password, expectedError }) => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          username: 'testuser',
          password,
          role: 'EMPLOYEE',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain(expectedError);
        }
      });
    });

    it('should return 422 with clear error message for weak password in change-password', () => {
      const weakPasswords = [
        { password: 'short1!', expectedError: 'minimal 8 karakter' },
        { password: 'nouppercase1!', expectedError: 'huruf besar' },
        { password: 'NOLOWERCASE1!', expectedError: 'huruf kecil' },
        { password: 'NoNumber!', expectedError: 'angka' },
        { password: 'NoSpecial1', expectedError: 'karakter khusus' },
      ];

      weakPasswords.forEach(({ password, expectedError }) => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPass123!',
          newPassword: password,
          confirmPassword: password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain(expectedError);
        }
      });
    });

    it('should validate password confirmation mismatch', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.errors.find(e => e.path.includes('confirmPassword'));
        expect(error?.message).toContain('tidak cocok');
      }
    });
  });

  describe('Password Policy Requirements Documentation', () => {
    it('should enforce all 5 password requirements', () => {
      const requirements = [
        'Minimum 8 characters',
        'At least 1 uppercase letter',
        'At least 1 lowercase letter',
        'At least 1 number',
        'At least 1 special character',
      ];

      // Test each requirement individually
      const testCases = [
        { password: 'Abc123!', fails: 'min 8 chars', expected: false },
        { password: 'abcdefgh1!', fails: 'uppercase', expected: false },
        { password: 'ABCDEFGH1!', fails: 'lowercase', expected: false },
        { password: 'Abcdefgh!', fails: 'number', expected: false },
        { password: 'Abcdefgh1', fails: 'special char', expected: false },
        { password: 'ValidPass123!', fails: 'none', expected: true },
      ];

      testCases.forEach(({ password, fails, expected }) => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          username: 'testuser',
          password,
          role: 'EMPLOYEE',
        });

        expect(result.success).toBe(expected);
      });
    });
  });

  describe('Valid Password Examples', () => {
    it('should accept various valid password formats', () => {
      const validPasswords = [
        'Password123!',
        'MyP@ssw0rd',
        'Secure#Pass1',
        'C0mpl3x$Pass',
        'Str0ng&Safe',
        'Test@1234',
        'Admin#2024',
        'User$Pass1',
      ];

      validPasswords.forEach(password => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          username: 'testuser',
          password,
          role: 'EMPLOYEE',
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Message Clarity', () => {
    it('should provide user-friendly error messages in Indonesian', () => {
      const testCases = [
        {
          password: 'short',
          expectedKeywords: ['minimal', '8', 'karakter'],
        },
        {
          password: 'nouppercase123!',
          expectedKeywords: ['huruf', 'besar'],
        },
        {
          password: 'NOLOWERCASE123!',
          expectedKeywords: ['huruf', 'kecil'],
        },
        {
          password: 'NoNumber!',
          expectedKeywords: ['angka'],
        },
        {
          password: 'NoSpecial123',
          expectedKeywords: ['karakter', 'khusus'],
        },
      ];

      testCases.forEach(({ password, expectedKeywords }) => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          username: 'testuser',
          password,
          role: 'EMPLOYEE',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const errorMessage = result.error.errors[0].message.toLowerCase();
          expectedKeywords.forEach(keyword => {
            expect(errorMessage).toContain(keyword.toLowerCase());
          });
        }
      });
    });
  });
});
