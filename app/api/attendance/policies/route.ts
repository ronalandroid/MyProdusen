import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { db, attendancePolicies } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { and, desc, eq } from 'drizzle-orm';

function assertSuperadmin(role: string) {
  if (role !== 'SUPERADMIN') throw new Error('FORBIDDEN');
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertSuperadmin(user.role);
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const conditions = active === null ? [] : [eq(attendancePolicies.active, active !== 'false')];
    const rows = await db.select().from(attendancePolicies).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(attendancePolicies.createdAt));
    return successResponse(rows);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat mengelola kebijakan absensi');
    return errorResponse(error.message || 'Gagal mengambil kebijakan absensi');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertSuperadmin(user.role);
    const body = await request.json();
    const id = nanoid();
    const [row] = await db.insert(attendancePolicies).values({
      id,
      name: body.name || 'Kebijakan Absensi',
      active: body.active ?? true,
      appliesScopeType: body.appliesScopeType || 'COMPANY',
      appliesScopeId: body.appliesScopeId || null,
      graceMinutes: Number(body.graceMinutes ?? 0),
      lateTier1Min: Number(body.lateTier1Min ?? 1),
      lateTier1Max: Number(body.lateTier1Max ?? 15),
      lateTier1Deduction: Number(body.lateTier1Deduction ?? 5000),
      lateTier2Min: Number(body.lateTier2Min ?? 16),
      lateTier2Max: Number(body.lateTier2Max ?? 30),
      lateTier2Deduction: Number(body.lateTier2Deduction ?? 10000),
      halfDayAfterMinutes: Number(body.halfDayAfterMinutes ?? 30),
      halfDayPayFactor: Number(body.halfDayPayFactor ?? 0.5),
      geofenceRadiusMeters: Number(body.geofenceRadiusMeters ?? 150),
      payrollSyncEnabled: body.payrollSyncEnabled ?? true,
      createdBy: user.userId,
    }).returning();
    await logAudit(user.userId, 'ATTENDANCE_POLICY_CREATE', 'AttendancePolicy', id, undefined, row, request);
    return successResponse(row, 'Kebijakan absensi berhasil dibuat', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat membuat kebijakan absensi');
    return errorResponse(error.message || 'Gagal membuat kebijakan absensi');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertSuperadmin(user.role);
    const body = await request.json();
    if (!body.id) return errorResponse('ID kebijakan wajib diisi', 422);
    const [oldRow] = await db.select().from(attendancePolicies).where(eq(attendancePolicies.id, body.id)).limit(1);
    if (!oldRow) return errorResponse('Kebijakan absensi tidak ditemukan', 404);
    const [row] = await db.update(attendancePolicies).set({
      name: body.name ?? oldRow.name,
      active: body.active ?? oldRow.active,
      appliesScopeType: body.appliesScopeType ?? oldRow.appliesScopeType,
      appliesScopeId: body.appliesScopeId ?? oldRow.appliesScopeId,
      graceMinutes: body.graceMinutes !== undefined ? Number(body.graceMinutes) : oldRow.graceMinutes,
      lateTier1Min: body.lateTier1Min !== undefined ? Number(body.lateTier1Min) : oldRow.lateTier1Min,
      lateTier1Max: body.lateTier1Max !== undefined ? Number(body.lateTier1Max) : oldRow.lateTier1Max,
      lateTier1Deduction: body.lateTier1Deduction !== undefined ? Number(body.lateTier1Deduction) : oldRow.lateTier1Deduction,
      lateTier2Min: body.lateTier2Min !== undefined ? Number(body.lateTier2Min) : oldRow.lateTier2Min,
      lateTier2Max: body.lateTier2Max !== undefined ? Number(body.lateTier2Max) : oldRow.lateTier2Max,
      lateTier2Deduction: body.lateTier2Deduction !== undefined ? Number(body.lateTier2Deduction) : oldRow.lateTier2Deduction,
      halfDayAfterMinutes: body.halfDayAfterMinutes !== undefined ? Number(body.halfDayAfterMinutes) : oldRow.halfDayAfterMinutes,
      halfDayPayFactor: body.halfDayPayFactor !== undefined ? Number(body.halfDayPayFactor) : oldRow.halfDayPayFactor,
      geofenceRadiusMeters: body.geofenceRadiusMeters !== undefined ? Number(body.geofenceRadiusMeters) : oldRow.geofenceRadiusMeters,
      payrollSyncEnabled: body.payrollSyncEnabled ?? oldRow.payrollSyncEnabled,
      updatedAt: new Date(),
    }).where(eq(attendancePolicies.id, body.id)).returning();
    await logAudit(user.userId, 'ATTENDANCE_POLICY_UPDATE', 'AttendancePolicy', body.id, oldRow, row, request);
    return successResponse(row, 'Kebijakan absensi berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.message === 'FORBIDDEN') return forbiddenResponse('Hanya Superadmin yang dapat memperbarui kebijakan absensi');
    return errorResponse(error.message || 'Gagal memperbarui kebijakan absensi');
  }
}
