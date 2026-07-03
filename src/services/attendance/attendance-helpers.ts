import { db, employees, attendancePolicies, payrollRules } from '@/lib/db';
import { eq, and, gte, lt, or, isNull } from 'drizzle-orm';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK' | 'PERMISSION';

/** One reviewable check-in row for the admin selfie-review grid. */
export interface SelfieReviewItem {
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  checkInTime: Date;
  selfieUrl: string | null;
  geoStatus: string | null;
  distanceMeters: number | null;
  livenessScore: number | null;
  selfieVerified: boolean;
  needsReview: boolean;
  workDate: string;
}

/** Bound the admin review query so it can never run unbounded. */
export const SELFIE_REVIEW_MAX_ROWS = 500;

export function buildShiftStartAt(workDate: Date, startTime: string): Date {
  const [hours = '8', minutes = '0'] = startTime.split(':');
  const shiftStartAt = new Date(workDate);
  shiftStartAt.setHours(Number(hours), Number(minutes), 0, 0);
  return shiftStartAt;
}

export function formatWorkDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getActiveAttendancePolicy(employee: typeof employees.$inferSelect) {
  const [employeePolicy] = await db.select().from(attendancePolicies).where(and(
    eq(attendancePolicies.active, true),
    eq(attendancePolicies.appliesScopeType, 'EMPLOYEE'),
    eq(attendancePolicies.appliesScopeId, employee.id),
  )).limit(1);

  if (employeePolicy) return employeePolicy;

  const [companyPolicy] = await db.select().from(attendancePolicies).where(and(
    eq(attendancePolicies.active, true),
    eq(attendancePolicies.appliesScopeType, 'COMPANY'),
  )).limit(1);

  return companyPolicy ?? null;
}

export async function getActivePayrollRule(employee: typeof employees.$inferSelect) {
  const now = new Date();
  const [rule] = await db.select().from(payrollRules).where(and(
    eq(payrollRules.active, true),
    or(eq(payrollRules.employeeId, employee.id), eq(payrollRules.divisionId, employee.division ?? ''), isNull(payrollRules.employeeId)),
    or(isNull(payrollRules.effectiveFrom), lt(payrollRules.effectiveFrom, now)),
    or(isNull(payrollRules.effectiveTo), gte(payrollRules.effectiveTo, now)),
  )).limit(1);

  return rule ?? null;
}

export async function invalidateAttendanceCaches(employeeId?: string): Promise<void> {
  // All deletions are independent; order doesn't matter for invalidation.
  await Promise.all([
    cacheManager.invalidateByTag(CacheTags.attendance),
    ...(employeeId ? [cacheManager.delete(CacheKeys.attendance.today(employeeId))] : []),
    cacheManager.delete(CacheKeys.attendance.today()),
    cacheManager.deletePattern('attendance:list:*'),
    cacheManager.deletePattern('attendance:stats:*'),
    cacheManager.invalidateByTag(CacheTags.dashboard),
  ]);
}
