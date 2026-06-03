import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { successResponse } from '@/utils/response';
import { scheduleService } from '@/services/attendance/schedule.service';
import { employeeService } from '@/services/employees/employee.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a YYYY-MM-DD string into a local-midnight Date.
 * Throws a validation error for malformed/invalid dates.
 */
function parseIsoDate(value: string, field: string): Date {
  if (!ISO_DATE.test(value)) {
    throw AppError.validation(`${field} harus berformat YYYY-MM-DD`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw AppError.validation(`${field} bukan tanggal yang valid`);
  }
  return date;
}

const upsertScheduleSchema = z.object({
  employeeId: z.string().min(1, 'Karyawan wajib dipilih'),
  shiftId: z.string().min(1, 'Shift wajib dipilih'),
  date: z.string().regex(ISO_DATE, 'Tanggal harus berformat YYYY-MM-DD'),
  workLocationIds: z
    .array(z.string().min(1))
    .min(1, 'Pilih minimal satu lokasi kerja yang valid'),
});

/**
 * GET /api/attendance/schedules?from=YYYY-MM-DD&to=YYYY-MM-DD&employeeId=...
 * Superadmin: list per-day employee schedules in a date range.
 */
export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'ATTENDANCE_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat jadwal');
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const employeeId = searchParams.get('employeeId') || undefined;

  if (!fromParam || !toParam) {
    throw AppError.validation('Parameter from dan to wajib diisi');
  }

  const from = parseIsoDate(fromParam, 'from');
  const to = parseIsoDate(toParam, 'to');

  if (from.getTime() > to.getTime()) {
    throw AppError.validation('Tanggal from tidak boleh setelah to');
  }

  // Guardrail: cap the queryable window to keep responses bounded.
  const MAX_RANGE_DAYS = 92;
  const rangeDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw AppError.validation(`Rentang tanggal maksimal ${MAX_RANGE_DAYS} hari`);
  }

  const schedules = await scheduleService.listSchedulesForRange({ from, to, employeeId });

  return successResponse({ schedules, range: { from: fromParam, to: toParam } });
});

/**
 * POST /api/attendance/schedules
 * Superadmin: assign (create or replace) a per-day shift + valid work locations
 * for an employee. Idempotent on (employeeId, date).
 */
export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'ATTENDANCE_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk mengatur jadwal');
  }

  const data = await parseJsonBody(request, upsertScheduleSchema);

  // Validate the employee exists (throws NOT_FOUND otherwise).
  await employeeService.getEmployeeById(data.employeeId);

  const workLocationIds = [...new Set(data.workLocationIds)];
  const date = parseIsoDate(data.date, 'date');

  const result = await scheduleService.upsertSchedule({
    employeeId: data.employeeId,
    shiftId: data.shiftId,
    date,
    workLocationIds,
    createdBy: user.userId,
  });

  await logAudit(
    user.userId,
    'UPSERT',
    'EmployeeSchedule',
    result.id ?? `${data.employeeId}:${data.date}`,
    undefined,
    { employeeId: data.employeeId, shiftId: data.shiftId, date: data.date, workLocationIds },
    request,
  );

  return successResponse(result, 'Jadwal berhasil disimpan');
});
