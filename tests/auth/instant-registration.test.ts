import { afterEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db, users, employees, notifications } from '@/lib/db';
import { AuthService } from '@/services/auth/auth.service';
import { registerInstantEmployee, resolveDefaultAssignments } from '@/services/auth/instant-registration';

const authService = new AuthService();

const createdUserIds: string[] = [];
const createdEmployeeIds: string[] = [];

function uniqueSuffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedLeaderEmployee() {
  const suffix = uniqueSuffix();
  const userId = `user_instreg_leader_${suffix}`;
  await db.insert(users).values({
    id: userId,
    email: `instreg_leader_${suffix}@test.com`,
    username: `instreg_leader_${suffix}`,
    password: 'x',
    role: 'LEADER',
    isActive: true,
  });
  createdUserIds.push(userId);

  const employeeId = `emp_instreg_leader_${suffix}`;
  await db.insert(employees).values({
    id: employeeId,
    userId,
    nip: `INSTREG-${suffix}`,
    fullName: 'Leader Uji Instan',
    email: `instreg_leader_${suffix}@test.com`,
    joinDate: new Date(),
    status: 'ACTIVE',
  });
  createdEmployeeIds.push(employeeId);
  return employeeId;
}

async function seedSuperadmin() {
  const suffix = uniqueSuffix();
  const userId = `user_instreg_admin_${suffix}`;
  await db.insert(users).values({
    id: userId,
    email: `instreg_admin_${suffix}@test.com`,
    username: `instreg_admin_${suffix}`,
    password: 'x',
    role: 'SUPERADMIN',
    isActive: true,
  });
  createdUserIds.push(userId);
  return userId;
}

function registrationInput(overrides: Record<string, unknown> = {}) {
  const suffix = uniqueSuffix();
  return {
    email: `instreg_${suffix}@test.com`,
    username: `instreg_${suffix}`,
    password: 'PasswordInstan123!',
    fullName: 'Budi Pendaftar Instan',
    ...overrides,
  };
}

afterEach(async () => {
  for (const id of createdEmployeeIds.splice(0)) {
    await db.delete(employees).where(eq(employees.id, id));
  }
  for (const id of createdUserIds.splice(0)) {
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
});

async function track(result: { user: { id: string }; employee: { id: string } }) {
  createdUserIds.push(result.user.id);
  createdEmployeeIds.push(result.employee.id);
}

describe('instant self-registration', () => {
  it('creates an ACTIVE user with an employee profile that can log in immediately', async () => {
    const expectedDefaults = await resolveDefaultAssignments();
    const input = registrationInput({ division: 'Produksi', position: 'Operator Cetak' });

    const result = await registerInstantEmployee(input);
    await track(result);

    expect(result.user.isActive).toBe(true);
    expect(result.employee.fullName).toBe('Budi Pendaftar Instan');
    expect(result.employee.division).toBe('Produksi');
    expect(result.employee.position).toBe('Operator Cetak');
    expect(result.employee.nip).toBeTruthy();

    // Default assignments so attendance works right away, no admin step needed.
    expect(result.employee.defaultLocationId).toBe(expectedDefaults.defaultLocationId);
    expect(result.employee.defaultShiftId).toBe(expectedDefaults.defaultShiftId);

    const login = await authService.login(input.email, input.password);
    expect(login.user.id).toBe(result.user.id);
    expect(login.user.employee?.id).toBe(result.employee.id);

    // Verification starts pending: Superadmin sign-off + mailbox proof later.
    expect(result.employee.verifiedAt).toBeNull();
    const [freshUser] = await db.select({ emailVerifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.id, result.user.id)).limit(1);
    expect(freshUser?.emailVerifiedAt).toBeNull();
  });

  it('honors a valid supervisor pick and silently drops an invalid one', async () => {
    const leaderEmployeeId = await seedLeaderEmployee();

    const withLeader = await registerInstantEmployee(registrationInput({ supervisorId: leaderEmployeeId }));
    await track(withLeader);
    expect(withLeader.employee.supervisorId).toBe(leaderEmployeeId);

    const withBogus = await registerInstantEmployee(registrationInput({ supervisorId: 'emp_tidak_ada' }));
    await track(withBogus);
    expect(withBogus.employee.supervisorId).toBeNull();
  });

  it('notifies superadmins so they can verify, adjust, or deactivate the newcomer', async () => {
    const adminUserId = await seedSuperadmin();

    const result = await registerInstantEmployee(registrationInput());
    await track(result);

    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, adminUserId)))
      .limit(5);

    expect(notification?.title).toContain('Karyawan baru');
    expect(notification?.message).toContain('Budi Pendaftar Instan');
  });

  it('does not leave an orphan user when the email is already taken', async () => {
    const input = registrationInput();
    const first = await registerInstantEmployee(input);
    await track(first);

    await expect(registerInstantEmployee(registrationInput({ email: input.email }))).rejects.toThrow('Email sudah terdaftar');
  });
});
