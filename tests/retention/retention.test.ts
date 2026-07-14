import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, inArray, like } from 'drizzle-orm';
import { db, attendances, auditLogs, employees, users } from '@/lib/db';
import { runRetentionSweep } from '@/lib/retention/retention-service';
import {
  retentionCutoffs,
  clampBatch,
  RETENTION_PURGED_MARKER,
  DEFAULT_SWEEP_BATCH,
  MAX_SWEEP_BATCH,
} from '@/lib/retention/retention-policy';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const selfieKey = `attendance-selfies/test-retention/${Date.now()}.jpg`;
const absSelfiePath = path.join(UPLOAD_DIR, 'attendance-selfies', 'test-retention', `${selfieKey.split('/').pop()}`);

const userId = `test_user_ret_${Date.now()}`;
const employeeId = `test_emp_ret_${Date.now()}`;
const oldAttId = `test_att_ret_old_${Date.now()}`;
const recentAttId = `test_att_ret_recent_${Date.now()}`;
const oldAuditId = `test_audit_ret_old_${Date.now()}`;
const recentAuditId = `test_audit_ret_recent_${Date.now()}`;

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

beforeAll(async () => {
  await fs.mkdir(path.dirname(absSelfiePath), { recursive: true });
  await fs.writeFile(absSelfiePath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]));

  await db.insert(users).values({ id: userId, email: `${userId}@test.com`, username: userId, password: 'x', role: 'EMPLOYEE', isActive: true });
  await db.insert(employees).values({ id: employeeId, userId, nip: `RET-${Date.now()}`, fullName: 'Retensi Uji', email: `${userId}@test.com`, joinDate: new Date(), status: 'ACTIVE' });

  // 8 months old → beyond the 6-month selfie window.
  await db.insert(attendances).values({
    id: oldAttId, employeeId, workLocationId: 'loc_x', checkInTime: monthsAgo(8),
    checkInLatitude: 3.6, checkInLongitude: 98.7, status: 'PRESENT',
    checkInSelfie: selfieKey, checkInSelfiePath: selfieKey, checkInSelfieUrl: `/uploads/${selfieKey}`,
  });
  // 1 month old → inside the window, must be untouched.
  await db.insert(attendances).values({
    id: recentAttId, employeeId, workLocationId: 'loc_x', checkInTime: monthsAgo(1),
    checkInLatitude: 3.6, checkInLongitude: 98.7, status: 'PRESENT',
    checkInSelfie: 'attendance-selfies/keep/recent.jpg', checkInSelfiePath: 'attendance-selfies/keep/recent.jpg',
  });

  await db.insert(auditLogs).values({ id: oldAuditId, userId, action: 'CHECK_IN', entity: 'Attendance', createdAt: monthsAgo(14) });
  await db.insert(auditLogs).values({ id: recentAuditId, userId, action: 'CHECK_IN', entity: 'Attendance', createdAt: monthsAgo(2) });
});

afterAll(async () => {
  await db.delete(attendances).where(inArray(attendances.id, [oldAttId, recentAttId]));
  await db.delete(auditLogs).where(inArray(auditLogs.id, [oldAuditId, recentAuditId]));
  await db.delete(employees).where(eq(employees.id, employeeId));
  await db.delete(users).where(eq(users.id, userId));
  await fs.rm(path.dirname(absSelfiePath), { recursive: true, force: true }).catch(() => undefined);
});

describe('retention policy', () => {
  it('computes 6-month selfie and 12-month audit cutoffs', () => {
    const now = new Date('2026-07-14T00:00:00Z');
    const { selfieCutoff, auditCutoff } = retentionCutoffs(now);
    expect(selfieCutoff.getMonth()).toBe(new Date('2026-01-14').getMonth());
    expect(auditCutoff.getFullYear()).toBe(2025);
  });

  it('clamps batch size within bounds', () => {
    expect(clampBatch(undefined)).toBe(DEFAULT_SWEEP_BATCH);
    expect(clampBatch(0)).toBe(1);
    expect(clampBatch(999999)).toBe(MAX_SWEEP_BATCH);
    expect(clampBatch(100)).toBe(100);
  });
});

describe('runRetentionSweep', () => {
  it('dry run reports expired items but deletes NOTHING', async () => {
    const result = await runRetentionSweep({ dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.selfiesPurged).toBeGreaterThanOrEqual(1);
    expect(result.auditLogsDeleted).toBeGreaterThanOrEqual(1);

    // File still on disk, DB untouched.
    await expect(fs.access(absSelfiePath)).resolves.toBeUndefined();
    const [oldRow] = await db.select({ selfie: attendances.checkInSelfie }).from(attendances).where(eq(attendances.id, oldAttId));
    expect(oldRow.selfie).toBe(selfieKey);
    const [oldAudit] = await db.select({ id: auditLogs.id }).from(auditLogs).where(eq(auditLogs.id, oldAuditId));
    expect(oldAudit?.id).toBe(oldAuditId);
  });

  it('real run purges expired selfies + old audit, preserves recent, and is idempotent', async () => {
    const result = await runRetentionSweep({ dryRun: false });
    expect(result.dryRun).toBe(false);
    expect(result.filesDeleted).toBeGreaterThanOrEqual(1);

    // Old selfie file gone, column tombstoned.
    await expect(fs.access(absSelfiePath)).rejects.toBeTruthy();
    const [oldRow] = await db.select().from(attendances).where(eq(attendances.id, oldAttId));
    expect(oldRow.checkInSelfie).toBe(RETENTION_PURGED_MARKER);
    expect(oldRow.checkInSelfiePath).toBeNull();

    // Recent attendance untouched.
    const [recentRow] = await db.select({ selfie: attendances.checkInSelfie }).from(attendances).where(eq(attendances.id, recentAttId));
    expect(recentRow.selfie).toBe('attendance-selfies/keep/recent.jpg');

    // Old audit deleted, recent audit kept.
    const remaining = await db.select({ id: auditLogs.id }).from(auditLogs).where(inArray(auditLogs.id, [oldAuditId, recentAuditId]));
    expect(remaining.map((r) => r.id)).toEqual([recentAuditId]);

    // Idempotent: a second run finds no expired selfies for this employee.
    const second = await runRetentionSweep({ dryRun: false });
    const stillExpired = await db
      .select({ id: attendances.id })
      .from(attendances)
      .where(and(eq(attendances.id, oldAttId), like(attendances.checkInSelfie, `${selfieKey}`)));
    expect(stillExpired).toHaveLength(0);
    expect(second.dryRun).toBe(false);
  });
});
