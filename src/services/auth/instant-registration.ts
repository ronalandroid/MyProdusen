import { and, asc, eq } from 'drizzle-orm';
import { db, users, employees, workLocations, shifts } from '@/lib/db';
import { authService } from './auth.service';
import { employeeService } from '@/services/employees/employee.service';
import { notifyUser } from '@/lib/notifications/dispatch';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';

export type InstantRegistrationInput = {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  division?: string;
  position?: string;
  /** Employee id of the chosen leader/atasan; silently dropped when invalid. */
  supervisorId?: string;
};

export type DefaultAssignments = {
  defaultLocationId: string | null;
  defaultShiftId: string | null;
};

/**
 * New hires are auto-assigned the company's primary (oldest active) work
 * location and shift so they can clock in the moment they register; the
 * Superadmin adjusts them later and every report follows the assignment.
 */
export async function resolveDefaultAssignments(): Promise<DefaultAssignments> {
  const [location] = await db
    .select({ id: workLocations.id })
    .from(workLocations)
    .where(eq(workLocations.isActive, true))
    .orderBy(asc(workLocations.createdAt))
    .limit(1);

  const [shift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(eq(shifts.isActive, true))
    .orderBy(asc(shifts.createdAt))
    .limit(1);

  return { defaultLocationId: location?.id ?? null, defaultShiftId: shift?.id ?? null };
}

async function resolveSupervisor(supervisorId: string | undefined): Promise<string | undefined> {
  if (!supervisorId) return undefined;
  const [supervisor] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.id, supervisorId), eq(employees.status, 'ACTIVE')))
    .limit(1);
  return supervisor?.id;
}

async function notifySuperadminsOfRegistration(employee: { id: string; fullName: string; division: string | null; position: string | null }) {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'SUPERADMIN'));

  const detail = [employee.division, employee.position].filter(Boolean).join(' · ');
  await Promise.all(
    admins
      .filter((admin) => admin)
      .map((admin) =>
        notifyUser({
          userId: admin.id,
          title: 'Karyawan baru mendaftar',
          message: `${employee.fullName}${detail ? ` (${detail})` : ''} baru saja mendaftar dan langsung aktif. Silakan verifikasi datanya — ubah penugasan atau nonaktifkan bila tidak dikenal.`,
          type: 'INFO',
        }),
      ),
  );

  await publishRealtimeEvent(
    createRealtimeEvent({
      type: 'dashboard.updated',
      scope: 'role',
      target: 'SUPERADMIN',
      payload: { source: 'employee.registered', employeeId: employee.id, fullName: employee.fullName },
    }),
  ).catch(() => undefined);
}

/**
 * Self-service onboarding: the account is ACTIVE immediately and comes with a
 * ready-to-clock-in employee profile. Superadmin's job shifts from gatekeeper
 * to verifier (adjust, deactivate, or fix assignments after the fact).
 */
export async function registerInstantEmployee(input: InstantRegistrationInput) {
  const user = await authService.register({
    email: input.email,
    username: input.username,
    password: input.password,
    role: 'EMPLOYEE',
    isActive: true,
  });

  try {
    const [defaults, supervisorId] = await Promise.all([
      resolveDefaultAssignments(),
      resolveSupervisor(input.supervisorId),
    ]);

    const employee = await employeeService.createEmployeeProfileForUser(user.id, {
      fullName: input.fullName,
      phone: input.phone,
      division: input.division,
      position: input.position,
      supervisorId,
      defaultLocationId: defaults.defaultLocationId ?? undefined,
      defaultShiftId: defaults.defaultShiftId ?? undefined,
      verified: false,
    });

    await notifySuperadminsOfRegistration(employee).catch(() => undefined);

    return { user, employee, defaults };
  } catch (error) {
    // Never strand a login-able user without an employee profile.
    await db.delete(users).where(eq(users.id, user.id)).catch(() => undefined);
    throw error;
  }
}
