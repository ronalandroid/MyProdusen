import { describe, it, expect, afterEach, vi } from 'vitest';
import { db, users } from '@/lib/db';
import { inArray } from 'drizzle-orm';

// Stub the external HaveIBeenPwned breach check so register/changePassword run
// deterministically without a network call (keeps validatePassword real).
vi.mock('@/lib/password-policy', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/password-policy')>();
  return { ...actual, checkPasswordCompromised: vi.fn(async () => false) };
});

import { authService } from '@/services/auth/auth.service';

describe('AuthService register/changePassword (mocked breach check)', () => {
  const userIds: string[] = [];

  afterEach(async () => {
    if (userIds.length > 0) {
      await db.delete(users).where(inArray(users.id, userIds));
      userIds.length = 0;
    }
  });

  it('registers a new user and rejects a duplicate email', async () => {
    const u = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const email = `itest-reg-${u}@t.local`;
    const created = await authService.register({
      email, username: `itestreg${u}`, password: 'StrongP@ssw0rd123!', role: 'EMPLOYEE',
    });
    userIds.push(created.id);
    expect(created.email).toBe(email);

    await expect(
      authService.register({
        email, username: `itestreg${u}b`, password: 'StrongP@ssw0rd123!', role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(/sudah terdaftar/i);
  });

  it('changes a password when the current password is correct', async () => {
    const u = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const created = await authService.register({
      email: `itest-cp-${u}@t.local`, username: `itestcp${u}`, password: 'StrongP@ssw0rd123!', role: 'EMPLOYEE',
    });
    userIds.push(created.id);

    await authService.changePassword(created.id, 'StrongP@ssw0rd123!', 'NewStr0ng!Pass456');
    expect(true).toBe(true); // no throw == success
  });

  it('password-reset token chain: createPasswordResetToken -> resetPassword', async () => {
    const u = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const email = `itest-rst-${u}@t.local`;
    const created = await authService.register({
      email, username: `itestrst${u}`, password: 'StrongP@ssw0rd123!', role: 'EMPLOYEE',
    });
    userIds.push(created.id);

    const token = await authService.createPasswordResetToken(email);
    expect(token).toBeTruthy();
    const result = await authService.resetPassword(token as string, 'ResetStr0ng!Pass789');
    expect(result.success).toBe(true);
  });

  it('activation token chain: createAccountActivationToken -> activateAccount', async () => {
    const u = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const email = `itest-act-${u}@t.local`;
    const created = await authService.register({
      email, username: `itestact${u}`, password: 'StrongP@ssw0rd123!', role: 'EMPLOYEE', isActive: false,
    });
    userIds.push(created.id);

    const res = await authService.createAccountActivationToken(email);
    expect(res).toBeTruthy();
    const activated = await authService.activateAccount((res as { token: string }).token);
    expect(activated.success).toBe(true);
    expect(activated.isActive).toBe(true);
  });
});
