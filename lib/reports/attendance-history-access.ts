/**
 * Centralised filter parsing + RBAC enforcement for attendance reports.
 * Used by both the JSON list endpoint and the CSV export endpoint so the
 * permission rules cannot drift between code paths.
 */

import type { JwtPayload } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import {
  type AttendanceHistoryFilters,
  endOfDayUtc,
  normalizeGeoStatus,
  normalizeStatus,
  startOfDayUtc,
  startOfMonthUtc,
} from './attendance-history';

export type AttendanceReportMode = 'view' | 'export';

export interface ResolvedAttendanceReportRequest {
  filters: AttendanceHistoryFilters;
  scope: 'self' | 'team' | 'all';
}

export interface ParseError {
  status: number;
  error: string;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Parse and validate filters from a URLSearchParams source. Mode controls
 * mandatory date-range rules (export requires a finite range).
 */
export async function resolveAttendanceReportRequest(
  searchParams: URLSearchParams,
  viewer: JwtPayload,
  mode: AttendanceReportMode,
): Promise<{ ok: true; resolved: ResolvedAttendanceReportRequest } | { ok: false } & ParseError> {
  // ----- date range ------------------------------------------------------
  const rawFrom = parseDate(searchParams.get('from'));
  const rawTo = parseDate(searchParams.get('to'));

  if (mode === 'export' && (!rawFrom || !rawTo)) {
    return { ok: false, status: 422, error: 'Rentang tanggal (from & to) wajib diisi untuk export.' };
  }

  if (rawFrom && rawTo && rawFrom.getTime() > rawTo.getTime()) {
    return { ok: false, status: 422, error: 'Tanggal awal harus lebih kecil dari tanggal akhir.' };
  }

  const from = rawFrom ? startOfDayUtc(rawFrom) : startOfMonthUtc();
  const to = rawTo ? endOfDayUtc(rawTo) : endOfDayUtc(new Date());

  // ----- generic filters -------------------------------------------------
  const status = normalizeStatus(searchParams.get('status'));
  const geoStatus = normalizeGeoStatus(searchParams.get('geoStatus'));
  const division = searchParams.get('division')?.trim() || undefined;
  const workLocationId = searchParams.get('workLocationId')?.trim() || undefined;
  const employeeIdFilter = searchParams.get('employeeId')?.trim() || undefined;
  const lateOnly = searchParams.get('lateOnly') === 'true';
  const missingCheckoutOnly = searchParams.get('missingCheckoutOnly') === 'true';

  const baseFilters: AttendanceHistoryFilters = {
    from,
    to,
    status,
    geoStatus,
    division,
    workLocationId,
    employeeId: employeeIdFilter,
    lateOnly,
    missingCheckoutOnly,
  };

  // ----- RBAC scoping ----------------------------------------------------
  if (viewer.role === 'EMPLOYEE') {
    if (mode === 'export' && !hasPermission(viewer.role, 'REPORT_EXPORT')) {
      return { ok: false, status: 403, error: 'Karyawan tidak diizinkan mengekspor laporan.' };
    }
    const employee = await employeeService.getEmployeeByUserId(viewer.userId).catch(() => null);
    if (!employee) {
      return { ok: false, status: 404, error: 'Data karyawan tidak ditemukan.' };
    }
    return {
      ok: true,
      resolved: {
        scope: 'self',
        filters: { ...baseFilters, employeeId: employee.id, supervisorId: undefined },
      },
    };
  }


  if (viewer.role === 'SUPERADMIN') {
    if (mode === 'export' && !hasPermission(viewer.role, 'REPORT_EXPORT')) {
      return { ok: false, status: 403, error: 'Anda tidak memiliki akses export laporan.' };
    }
    return {
      ok: true,
      resolved: { scope: 'all', filters: baseFilters },
    };
  }

  return { ok: false, status: 403, error: 'Anda tidak memiliki akses laporan absensi.' };
}
