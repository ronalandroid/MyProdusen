import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { db, employees, employeeTeamAssignments, users } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';
import { getNextNIP } from '@/utils/nip-generator';
import { saveProfileAvatar, UploadError } from '@/lib/upload';
import { calculateWorkDurationDays, formatWorkDuration } from '@/src/services/employees/work-duration.service';

const PRIVATE_HEADERS = { 'Cache-Control': 'no-store, private', Pragma: 'no-cache', Expires: '0' };
const FORBIDDEN_FIELDS = new Set(['role', 'teamId', 'division', 'position', 'defaultLocationId', 'defaultShiftId', 'locationId', 'shiftId', 'isActive', 'employeeId', 'payroll', 'permission', 'permissions']);

function ok(data: unknown, message?: string) {
  return NextResponse.json({ success: true, data, message }, { headers: PRIVATE_HEADERS });
}

function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers: PRIVATE_HEADERS });
}

function normalizePhone(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeAddress(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeFullName(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function validateProfileInput(body: Record<string, unknown>) {
  const forbidden = Object.keys(body).filter((key) => FORBIDDEN_FIELDS.has(key));
  if (forbidden.length > 0) return { error: fail('PROFILE_UPDATE_FORBIDDEN_FIELD', 'Data pekerjaan hanya dapat diubah oleh Superadmin', 403) };
  const phone = normalizePhone(body.phone);
  const address = normalizeAddress(body.address);
  const fullName = normalizeFullName(body.fullName ?? body.name);
  if (!fullName || fullName.length < 3) return { error: fail('PROFILE_FULL_NAME_REQUIRED', 'Nama lengkap minimal 3 karakter', 422) };
  if (!phone) return { error: fail('PROFILE_PHONE_REQUIRED', 'Nomor HP wajib diisi', 422) };
  if (!/^(\+62|62|0)[0-9\-\s]{8,17}$/.test(phone)) return { error: fail('PROFILE_PHONE_REQUIRED', 'Nomor HP harus memakai format Indonesia yang valid', 422) };
  if (!address) return { error: fail('PROFILE_ADDRESS_REQUIRED', 'Alamat lengkap wajib diisi', 422) };
  if (address.length < 10) return { error: fail('PROFILE_ADDRESS_TOO_SHORT', 'Alamat lengkap minimal 10 karakter', 422) };
  if (address.length > 500) return { error: fail('PROFILE_ADDRESS_REQUIRED', 'Alamat lengkap maksimal 500 karakter', 422) };
  return { phone, address, fullName };
}

async function buildProfile(userId: string) {
  const [user] = await db.select({ id: users.id, email: users.email, username: users.username, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const [employee] = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  const [team] = employee ? await db.select({ teamId: employeeTeamAssignments.teamId }).from(employeeTeamAssignments).where(and(eq(employeeTeamAssignments.employeeId, employee.id), eq(employeeTeamAssignments.active, true))).limit(1) : [];
  const employeeAny = employee as any;
  const startDate = employeeAny?.workStartDate || employee?.joinDate || null;
  return {
    user: { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive },
    role: user.role,
    fullName: employee?.fullName || user.username || '',
    employeeId: employee?.id || null,
    workStartDate: startDate,
    workDurationDays: calculateWorkDurationDays(startDate),
    workDurationLabel: formatWorkDuration(startDate),
    phone: employee?.phone || '',
    address: employee?.address || '',
    profilePhoto: employee?.profilePhoto || '',
    profileCompleted: Boolean(employee?.phone && employee?.address && employee?.profilePhoto && employee?.profileCompletedAt),
    profileCompletedAt: employee?.profileCompletedAt || null,
    assignmentStatus: {
      hasDivision: Boolean(employee?.division),
      hasPosition: Boolean(employee?.position),
      hasLocation: Boolean(employee?.defaultLocationId),
      hasShift: Boolean(employee?.defaultShiftId),
      hasTeam: Boolean(team?.teamId),
    },
  };
}

async function createEmployeeProfileForUser(user: { userId: string; email: string }, phone: string, address: string, fullName: string) {
  const allEmployees = await db.select({ nip: employees.nip }).from(employees);
  const nip = await getNextNIP(new Date(), allEmployees.map((row) => row.nip));
  const [userRow] = await db.select({ username: users.username, email: users.email }).from(users).where(eq(users.id, user.userId)).limit(1);
  const id = `emp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const [employee] = await db.insert(employees).values({
    id,
    nip,
    userId: user.userId,
    fullName,
    email: userRow?.email || user.email,
    phone,
    address,
    status: 'ACTIVE',
    profileCompletedAt: new Date(),
    joinDate: new Date(),
  }).returning();
  return employee;
}

async function readProfilePatchBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return {
      body: Object.fromEntries(formData.entries()),
      avatar: formData.get('avatar') instanceof File ? formData.get('avatar') as File : null,
    };
  }
  return { body: await request.json().catch(() => ({})), avatar: null };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const profile = await buildProfile(user.userId);
    if (!profile) return fail('ACCESS_DENIED', 'Akses ditolak', 403);
    return ok(profile);
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return fail('ACCESS_DENIED', 'Anda harus login', 401);
    return fail('ACCESS_DENIED', 'Gagal mengambil profil', 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { body, avatar } = await readProfilePatchBody(request);
    const validated = validateProfileInput(body);
    if ('error' in validated) {
      await logAudit(user.userId, 'PROFILE_UPDATE_FORBIDDEN_ATTEMPT', 'Employee', undefined, undefined, { attemptedFields: Object.keys(body).filter((key) => FORBIDDEN_FIELDS.has(key)) }, request);
      return validated.error;
    }
    const [employee] = await db.select().from(employees).where(eq(employees.userId, user.userId)).limit(1);
    if (!employee?.profilePhoto && !avatar) {
      return fail('PROFILE_AVATAR_REQUIRED', 'Foto profil wajib diunggah', 422);
    }
    const before = employee ? { fullName: employee.fullName, phone: employee.phone, address: employee.address, profileCompletedAt: employee.profileCompletedAt } : undefined;
    const saved = employee
      ? (await db.update(employees).set({ fullName: validated.fullName, phone: validated.phone, address: validated.address, profileCompletedAt: employee.profileCompletedAt || new Date(), updatedAt: new Date() }).where(eq(employees.id, employee.id)).returning())[0]
      : await createEmployeeProfileForUser(user, validated.phone, validated.address, validated.fullName);
    let avatarResult: Awaited<ReturnType<typeof saveProfileAvatar>> | null = null;
    if (avatar) {
      avatarResult = await saveProfileAvatar({ file: avatar, employeeId: saved.id });
    }
    const finalSaved = avatarResult
      ? (await db.update(employees).set({ profilePhoto: avatarResult.path, profileCompletedAt: saved.profileCompletedAt || new Date(), updatedAt: new Date() }).where(eq(employees.id, saved.id)).returning())[0]
      : saved;
    await logAudit(user.userId, before?.profileCompletedAt ? 'PROFILE_UPDATED' : 'PROFILE_COMPLETED', 'Employee', finalSaved.id, before, { fullName: finalSaved.fullName, phone: finalSaved.phone, address: finalSaved.address, profilePhoto: finalSaved.profilePhoto, profileCompletedAt: finalSaved.profileCompletedAt }, request);
    return ok(await buildProfile(user.userId), 'Data pribadi berhasil disimpan.');
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return fail('ACCESS_DENIED', 'Anda harus login', 401);
    if (error instanceof UploadError) return fail('PROFILE_AVATAR_INVALID', error.message, 422);
    return fail('ACCESS_DENIED', 'Gagal menyimpan data pribadi', 400);
  }
}
