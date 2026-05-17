/**
 * Shared attendance history query module.
 *
 * Single source of truth for both the on-screen report table and the CSV
 * export. Filters, projection, and ordering all happen here so the export
 * can never drift from what the user sees, and the heavy SQL is written
 * exactly once.
 *
 * Performance notes:
 *   - Uses a single LEFT JOIN against employees + workLocations + shifts.
 *     That keeps the query O(rows) instead of N+1.
 *   - Selects only the columns the report needs. Selfie binaries are NEVER
 *     read; only the path/MIME/size metadata used to derive boolean
 *     "has selfie" flags.
 *   - Date-range default is the current month. Export endpoints REQUIRE a
 *     finite range and a row-count cap (`ATTENDANCE_EXPORT_MAX_ROWS`).
 */

import { and, asc, desc, eq, gte, ilike, lt, or, sql, type SQL } from 'drizzle-orm';
import { db, attendances, employees, workLocations, shifts } from '@/lib/db';

export type AttendanceStatusFilter = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK' | 'PERMISSION';

export type GeoStatusFilter =
  | 'INSIDE'
  | 'OUTSIDE'
  | 'UNKNOWN'
  | 'GEOFENCE_EXCEPTION';

export interface AttendanceHistoryFilters {
  /** ISO start (inclusive). Default: first day of current month UTC. */
  from?: Date;
  /** ISO end (inclusive). Default: today (end of day) UTC. */
  to?: Date;
  employeeId?: string;
  /** Restrict to employees of a single supervisor. */
  supervisorId?: string;
  division?: string;
  workLocationId?: string;
  status?: AttendanceStatusFilter;
  geoStatus?: GeoStatusFilter;
  /** Only rows with `lateMinutes > 0`. */
  lateOnly?: boolean;
  /** Only rows where `checkOutTime` is missing. */
  missingCheckoutOnly?: boolean;
}

export interface AttendanceHistoryRow {
  id: string;
  attendanceDate: string; // YYYY-MM-DD
  employeeId: string;
  employeeUserId: string | null;
  employeeName: string;
  nip: string;
  division: string | null;
  position: string | null;
  workLocationId: string | null;
  workLocationName: string | null;
  shiftId: string | null;
  shiftName: string | null;
  checkInTime: Date;
  checkOutTime: Date | null;
  totalWorkMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatusFilter;
  geoStatus: GeoStatusFilter;
  checkInDistance: number | null;
  checkOutDistance: number | null;
  hasCheckInSelfie: boolean;
  hasCheckOutSelfie: boolean;
}

export interface AttendanceHistoryPage {
  rows: AttendanceHistoryRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AttendanceHistorySummary {
  totalRecords: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeaveSickPermission: number;
  totalMissingCheckout: number;
  totalOutsideGeofence: number;
  averageLateMinutes: number;
  totalWorkMinutes: number;
  totalWorkHours: number;
}

const ALLOWED_STATUS = new Set<AttendanceStatusFilter>([
  'PRESENT',
  'LATE',
  'ABSENT',
  'LEAVE',
  'SICK',
  'PERMISSION',
]);

const ALLOWED_GEO = new Set<GeoStatusFilter>([
  'INSIDE',
  'OUTSIDE',
  'UNKNOWN',
  'GEOFENCE_EXCEPTION',
]);

const DEFAULT_RADIUS = 100;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

export const DEFAULT_EXPORT_MAX_ROWS = 5000;

export function getExportMaxRows(): number {
  const raw = Number(process.env.ATTENDANCE_EXPORT_MAX_ROWS || '');
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(Math.max(1, Math.round(raw)), 50_000);
  }
  return DEFAULT_EXPORT_MAX_ROWS;
}

export function startOfMonthUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function endOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

export function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

export function normalizeStatus(value: string | null | undefined): AttendanceStatusFilter | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase() as AttendanceStatusFilter;
  return ALLOWED_STATUS.has(upper) ? upper : undefined;
}

export function normalizeGeoStatus(value: string | null | undefined): GeoStatusFilter | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase() as GeoStatusFilter;
  return ALLOWED_GEO.has(upper) ? upper : undefined;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

export function clampPageSize(value: unknown): number {
  return clampInt(value, 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
}

export function clampPage(value: unknown): number {
  return clampInt(value, 1, 100_000, 1);
}

function buildConditions(filters: AttendanceHistoryFilters): SQL[] {
  const conditions: SQL[] = [];

  const from = filters.from ?? startOfMonthUtc();
  const to = filters.to ? endOfDayUtc(filters.to) : endOfDayUtc(new Date());

  conditions.push(gte(attendances.checkInTime, from));
  conditions.push(lt(attendances.checkInTime, new Date(to.getTime() + 1)));

  if (filters.employeeId) conditions.push(eq(attendances.employeeId, filters.employeeId));
  if (filters.supervisorId) conditions.push(eq(employees.supervisorId, filters.supervisorId));
  if (filters.workLocationId) conditions.push(eq(attendances.workLocationId, filters.workLocationId));
  if (filters.division) conditions.push(ilike(employees.division, filters.division));
  if (filters.status) conditions.push(eq(attendances.status, filters.status));

  if (filters.lateOnly) {
    conditions.push(sql`${attendances.lateMinutes} > 0`);
  }

  if (filters.missingCheckoutOnly) {
    conditions.push(sql`${attendances.checkOutTime} IS NULL`);
  }

  if (filters.geoStatus) {
    switch (filters.geoStatus) {
      case 'INSIDE':
        conditions.push(
          sql`(${attendances.checkInDistance} IS NOT NULL AND ${attendances.checkInDistance} <= ${DEFAULT_RADIUS})`,
        );
        break;
      case 'OUTSIDE':
      case 'GEOFENCE_EXCEPTION':
        conditions.push(
          sql`(${attendances.checkInDistance} IS NOT NULL AND ${attendances.checkInDistance} > ${DEFAULT_RADIUS})`,
        );
        break;
      case 'UNKNOWN':
        conditions.push(sql`${attendances.checkInDistance} IS NULL`);
        break;
    }
  }

  return conditions;
}

const SELECTION = {
  id: attendances.id,
  employeeId: attendances.employeeId,
  employeeUserId: employees.userId,
  employeeName: employees.fullName,
  nip: employees.nip,
  division: employees.division,
  position: employees.position,
  workLocationId: attendances.workLocationId,
  workLocationName: workLocations.name,
  shiftId: attendances.shiftId,
  shiftName: shifts.name,
  checkInTime: attendances.checkInTime,
  checkOutTime: attendances.checkOutTime,
  totalWorkMinutes: attendances.totalWorkMinutes,
  lateMinutes: attendances.lateMinutes,
  earlyLeaveMinutes: attendances.earlyLeaveMinutes,
  status: attendances.status,
  checkInDistance: attendances.checkInDistance,
  checkOutDistance: attendances.checkOutDistance,
  // Selfie metadata only — never the binary or url payload.
  hasCheckInSelfie: sql<boolean>`(${attendances.checkInSelfiePath} IS NOT NULL OR ${attendances.checkInSelfieUrl} IS NOT NULL OR ${attendances.checkInSelfie} IS NOT NULL)`,
  hasCheckOutSelfie: sql<boolean>`(${attendances.checkOutSelfiePath} IS NOT NULL OR ${attendances.checkOutSelfieUrl} IS NOT NULL OR ${attendances.checkOutSelfie} IS NOT NULL)`,
};

function deriveGeoStatus(distance: number | null): GeoStatusFilter {
  if (distance === null || distance === undefined) return 'UNKNOWN';
  if (distance > DEFAULT_RADIUS) return 'OUTSIDE';
  return 'INSIDE';
}

function mapRow(row: any): AttendanceHistoryRow {
  const checkInTime = row.checkInTime instanceof Date ? row.checkInTime : new Date(row.checkInTime);
  const checkOutTime = row.checkOutTime
    ? row.checkOutTime instanceof Date
      ? row.checkOutTime
      : new Date(row.checkOutTime)
    : null;

  return {
    id: row.id,
    attendanceDate: checkInTime.toISOString().split('T')[0],
    employeeId: row.employeeId,
    employeeUserId: row.employeeUserId ?? null,
    employeeName: row.employeeName ?? '',
    nip: row.nip ?? '',
    division: row.division ?? null,
    position: row.position ?? null,
    workLocationId: row.workLocationId ?? null,
    workLocationName: row.workLocationName ?? null,
    shiftId: row.shiftId ?? null,
    shiftName: row.shiftName ?? null,
    checkInTime,
    checkOutTime,
    totalWorkMinutes: row.totalWorkMinutes ?? 0,
    lateMinutes: row.lateMinutes ?? 0,
    earlyLeaveMinutes: row.earlyLeaveMinutes ?? 0,
    status: row.status as AttendanceStatusFilter,
    geoStatus: deriveGeoStatus(row.checkInDistance),
    checkInDistance: row.checkInDistance ?? null,
    checkOutDistance: row.checkOutDistance ?? null,
    hasCheckInSelfie: Boolean(row.hasCheckInSelfie),
    hasCheckOutSelfie: Boolean(row.hasCheckOutSelfie),
  };
}

/**
 * Page through attendance history with all filters applied.
 * Used by both the on-screen table and (with limit=ATTENDANCE_EXPORT_MAX_ROWS,
 * page=1) the CSV export path.
 */
export async function fetchAttendanceHistoryPage(
  filters: AttendanceHistoryFilters,
  options: { page?: number; pageSize?: number } = {},
): Promise<AttendanceHistoryPage> {
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);

  const conditions = buildConditions(filters);
  const where = conditions.length ? and(...conditions) : undefined;

  const rowsQuery = db
    .select(SELECTION)
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id))
    .leftJoin(workLocations, eq(attendances.workLocationId, workLocations.id))
    .leftJoin(shifts, eq(attendances.shiftId, shifts.id))
    .orderBy(desc(attendances.checkInTime), asc(attendances.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id));

  if (where) {
    rowsQuery.where(where);
    countQuery.where(where);
  }

  const [rowsRaw, totalRaw] = await Promise.all([rowsQuery, countQuery]);

  return {
    rows: rowsRaw.map(mapRow),
    total: Number(totalRaw[0]?.count ?? 0),
    page,
    pageSize,
  };
}

/**
 * Pull rows for export. Caps at the configured maximum so a stray range can
 * never blow up the VPS. Returns rows ordered the same way as the table.
 */
export async function fetchAttendanceHistoryForExport(
  filters: AttendanceHistoryFilters,
  options: { limit?: number } = {},
): Promise<{ rows: AttendanceHistoryRow[]; truncated: boolean; total: number }> {
  const max = options.limit ?? getExportMaxRows();

  const conditions = buildConditions(filters);
  const where = conditions.length ? and(...conditions) : undefined;

  const totalQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id));

  const rowsQuery = db
    .select(SELECTION)
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id))
    .leftJoin(workLocations, eq(attendances.workLocationId, workLocations.id))
    .leftJoin(shifts, eq(attendances.shiftId, shifts.id))
    .orderBy(desc(attendances.checkInTime), asc(attendances.id))
    .limit(max + 1);

  if (where) {
    rowsQuery.where(where);
    totalQuery.where(where);
  }

  const [rowsRaw, totalRaw] = await Promise.all([rowsQuery, totalQuery]);
  const total = Number(totalRaw[0]?.count ?? 0);
  const truncated = rowsRaw.length > max;

  return {
    rows: rowsRaw.slice(0, max).map(mapRow),
    truncated,
    total,
  };
}

export async function fetchAttendanceSummary(
  filters: AttendanceHistoryFilters,
): Promise<AttendanceHistorySummary> {
  const conditions = buildConditions(filters);
  const where = conditions.length ? and(...conditions) : undefined;

  const summaryQuery = db
    .select({
      totalRecords: sql<number>`COUNT(*)::int`,
      totalPresent: sql<number>`COUNT(*) FILTER (WHERE ${attendances.status} = 'PRESENT')::int`,
      totalLate: sql<number>`COUNT(*) FILTER (WHERE ${attendances.status} = 'LATE')::int`,
      totalAbsent: sql<number>`COUNT(*) FILTER (WHERE ${attendances.status} = 'ABSENT')::int`,
      totalLeaveSickPermission: sql<number>`COUNT(*) FILTER (WHERE ${attendances.status} IN ('LEAVE','SICK','PERMISSION'))::int`,
      totalMissingCheckout: sql<number>`COUNT(*) FILTER (WHERE ${attendances.checkOutTime} IS NULL)::int`,
      totalOutsideGeofence: sql<number>`COUNT(*) FILTER (WHERE ${attendances.checkInDistance} IS NOT NULL AND ${attendances.checkInDistance} > ${DEFAULT_RADIUS})::int`,
      averageLateMinutes: sql<number>`COALESCE(AVG(NULLIF(${attendances.lateMinutes}, 0)), 0)::float`,
      totalWorkMinutes: sql<number>`COALESCE(SUM(${attendances.totalWorkMinutes}), 0)::int`,
    })
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id));

  if (where) summaryQuery.where(where);

  const [row] = await summaryQuery;

  const totalWorkMinutes = Number(row?.totalWorkMinutes ?? 0);

  return {
    totalRecords: Number(row?.totalRecords ?? 0),
    totalPresent: Number(row?.totalPresent ?? 0),
    totalLate: Number(row?.totalLate ?? 0),
    totalAbsent: Number(row?.totalAbsent ?? 0),
    totalLeaveSickPermission: Number(row?.totalLeaveSickPermission ?? 0),
    totalMissingCheckout: Number(row?.totalMissingCheckout ?? 0),
    totalOutsideGeofence: Number(row?.totalOutsideGeofence ?? 0),
    averageLateMinutes: Number(row?.averageLateMinutes ?? 0),
    totalWorkMinutes,
    totalWorkHours: Math.round((totalWorkMinutes / 60) * 100) / 100,
  };
}

export const ATTENDANCE_HISTORY_INTERNALS = { mapRow, buildConditions };
// Silence "or" import lint when geo branch unused — kept for potential extension.
void or;
