import { promises as fs } from 'node:fs';
import { and, isNotNull, lt, or, eq, sql } from 'drizzle-orm';
import { db, attendances, auditLogs } from '@/lib/db';
import { resolveSelfieStoragePath } from '@/lib/upload';
import { logger } from '@/lib/logger';
import {
  retentionCutoffs,
  clampBatch,
  RETENTION_PURGED_MARKER,
} from '@/lib/retention/retention-policy';

export interface RetentionSweepResult {
  dryRun: boolean;
  selfieCutoff: string;
  auditCutoff: string;
  attendancesWithExpiredSelfies: number;
  selfiesPurged: number;
  filesDeleted: number;
  auditLogsDeleted: number;
}

async function deleteFileIfPresent(pathValue: string | null | undefined): Promise<boolean> {
  if (!pathValue || pathValue === RETENTION_PURGED_MARKER) return false;
  const abs = resolveSelfieStoragePath(pathValue);
  if (!abs) return false;
  try {
    await fs.unlink(abs);
    return true;
  } catch (error: any) {
    // Missing file (already gone) is fine; anything else we log but do not throw
    // — retention must be resilient and idempotent.
    if (error?.code !== 'ENOENT') {
      logger.warn(`Retention: failed to delete selfie file ${abs}: ${error?.message ?? error}`);
    }
    return false;
  }
}

/**
 * Purge attendance selfies older than the retention window and delete audit
 * logs beyond theirs. Attendance ROWS are preserved — only selfie files are
 * removed and their path columns tombstoned. dryRun computes the same counts
 * without touching disk or DB. Batched to protect the single VPS.
 */
export async function runRetentionSweep(options: { dryRun?: boolean; batchLimit?: number; now?: Date } = {}): Promise<RetentionSweepResult> {
  const dryRun = options.dryRun ?? false;
  const batch = clampBatch(options.batchLimit);
  const { selfieCutoff, auditCutoff } = retentionCutoffs(options.now);

  const expiredSelfieCondition = and(
    lt(attendances.checkInTime, selfieCutoff),
    or(
      and(isNotNull(attendances.checkInSelfiePath), sql`${attendances.checkInSelfie} <> ${RETENTION_PURGED_MARKER}`),
      isNotNull(attendances.checkOutSelfiePath),
      isNotNull(attendances.checkOutSelfie),
    ),
  );

  const candidates = await db
    .select({
      id: attendances.id,
      checkInSelfie: attendances.checkInSelfie,
      checkInSelfiePath: attendances.checkInSelfiePath,
      checkOutSelfie: attendances.checkOutSelfie,
      checkOutSelfiePath: attendances.checkOutSelfiePath,
    })
    .from(attendances)
    .where(expiredSelfieCondition)
    .orderBy(attendances.checkInTime)
    .limit(batch);

  let filesDeleted = 0;
  let selfiesPurged = 0;

  if (!dryRun) {
    for (const row of candidates) {
      // Best-effort file deletion across all selfie path variants.
      for (const p of [row.checkInSelfie, row.checkInSelfiePath, row.checkOutSelfie, row.checkOutSelfiePath]) {
        if (await deleteFileIfPresent(p)) filesDeleted += 1;
      }
      await db
        .update(attendances)
        .set({
          checkInSelfie: RETENTION_PURGED_MARKER,
          checkInSelfieUrl: null,
          checkInSelfiePath: null,
          checkOutSelfie: null,
          checkOutSelfieUrl: null,
          checkOutSelfiePath: null,
          updatedAt: new Date(),
        })
        .where(eq(attendances.id, row.id));
      selfiesPurged += 1;
    }
  }

  // Audit logs beyond the window.
  let auditLogsDeleted = 0;
  if (dryRun) {
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(auditLogs)
      .where(lt(auditLogs.createdAt, auditCutoff));
    auditLogsDeleted = Number(count);
  } else {
    const deleted = await db.delete(auditLogs).where(lt(auditLogs.createdAt, auditCutoff)).returning({ id: auditLogs.id });
    auditLogsDeleted = deleted.length;
  }

  return {
    dryRun,
    selfieCutoff: selfieCutoff.toISOString(),
    auditCutoff: auditCutoff.toISOString(),
    attendancesWithExpiredSelfies: candidates.length,
    selfiesPurged: dryRun ? candidates.length : selfiesPurged,
    filesDeleted,
    auditLogsDeleted,
  };
}
