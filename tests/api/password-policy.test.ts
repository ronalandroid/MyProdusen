import { describe, it, expect } from 'vitest';
import { registerSchema, changePasswordSchema } from '@/utils/validation/auth';

describe('Password Policy Validation', () => {
  describe('Register Schema - Password Validation', () => {
    it('should reject password with less than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Abc1!',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('minimal 8 karakter');
      }
    });

    it('should reject password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'abcdefgh1!',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('huruf besar');
      }
    });

    it('should reject password without lowercase letter', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'ABCDEFGH1!',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('huruf kecil');
      }
    });

    it('should reject password without number', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Abcdefgh!',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('angka');
      }
    });

    it('should reject password without special character', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Abcdefgh1',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('karakter khusus');
      }
    });

    it('should accept valid strong password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongPass123!',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept password with various special characters', () => {
      const passwords = [
        'Password1@',
        'Password1#',
        'Password1$',
        'Password1%',
        'Password1^',
        'Password1&',
        'Password1*',
      ];

      passwords.forEach(password => {
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

  describe('Change Password Schema - Password Validation', () => {
    it('should reject new password with less than 8 characters', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPass123!',
        newPassword: 'Abc1!',
        confirmPassword: 'Abc1!',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('minimal 8 karakter');
      }
    });

    it('should reject new password without uppercase letter', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPass123!',
        newPassword: 'newpass123!',
        confirmPassword: 'newpass123!',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('huruf besar');
      }
    });

    it('should reject when passwords do not match', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('tidak cocok');
      }
    });

    it('should accept valid password change', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should accept exactly 8 characters with all requirements', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Abcd123!',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept very long password with all requirements', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'VeryLongPassword123!WithManyCharacters',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept password with multiple special characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'P@ssw0rd!#$%',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept password with spaces as special character', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Pass Word123!',
        role: 'EMPLOYEE',
      });
      
      expect(result.success).toBe(true);
    });
  });
});
