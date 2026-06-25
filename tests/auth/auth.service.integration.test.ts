import { describe, it, expect } from 'vitest';
import { authService } from '@/services/auth/auth.service';

/**
 * Integration tests for AuthService guard/read paths against a real DB. These
 * use non-existent ids and weak passwords so they throw before any external
 * breach-check call and need no seeding.
 */
describe('AuthService integration (real DB, guard paths)', () => {
  it('login: rejects an unknown email with a generic credentials error', async () => {
    await expect(authService.login('itest-nobody@itest.local', 'whatever')).rejects.toThrow(/salah/i);
  });

  it('resetPassword: rejects a weak new password before touching the token', async () => {
    await expect(authService.resetPassword('any-token', '123')).rejects.toThrow();
  });

  it('changePassword: rejects a weak new password', async () => {
    await expect(authService.changePassword('itest-nonexistent', 'oldpass', '123')).rejects.toThrow();
  });

  it('activateAccount: rejects an invalid activation token', async () => {
    await expect(authService.activateAccount('itest-invalid-token')).rejects.toThrow();
  });

  it('listUsers: returns an array', async () => {
    expect(Array.isArray(await authService.listUsers())).toBe(true);
  });

  it('countActiveSuperadmins: returns a non-negative number', async () => {
    const count = await authService.countActiveSuperadmins();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
