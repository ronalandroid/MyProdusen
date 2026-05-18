import { afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { AuthService } from '@/services/auth/auth.service';
import { db, users } from '@/lib/db';

const service = new AuthService();
const createdIds: string[] = [];

afterEach(async () => {
  for (const id of createdIds.splice(0)) {
    await db.delete(users).where(eq(users.id, id));
  }
});

describe('account self-activation', () => {
  it('creates an activation token for inactive public registration and activates login access', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user = await service.register({
      email: `activation_${unique}@test.com`,
      username: `activation_${unique}`,
      password: 'Password123!',
      role: 'EMPLOYEE',
      isActive: false,
    });
    createdIds.push(user.id);

    await expect(service.login(user.email, 'Password123!')).rejects.toThrow('Cek inbox email aktivasi');

    const activation = await service.createAccountActivationToken(user.email);
    expect(activation).toMatchObject({ token: expect.any(String), email: user.email });

    const activated = await service.activateAccount(activation!.token);
    expect(activated).toMatchObject({ userId: user.id, email: user.email, isActive: true });

    const login = await service.login(user.email, 'Password123!');
    expect(login.user.id).toBe(user.id);
  });

  it('rejects password reset token for account activation', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user = await service.register({
      email: `activation_wrong_${unique}@test.com`,
      username: `activation_wrong_${unique}`,
      password: 'Password123!',
      role: 'EMPLOYEE',
      isActive: true,
    });
    createdIds.push(user.id);

    const resetToken = await service.createPasswordResetToken(user.email);
    await expect(service.activateAccount(resetToken!)).rejects.toThrow('Token aktivasi akun tidak valid');
  });
});
