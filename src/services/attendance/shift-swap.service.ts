import { db } from '@/lib/db';
import { shiftSwapRequests, employeeSchedules } from '@/drizzle/schema';
import { and, eq, or, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { AppError } from '@/lib/core/app-error';

export type ShiftSwapStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export async function requestSwap(data: {
  requesterId: string;
  requesterDate: Date;
  targetId: string;
  targetDate: Date;
  reason: string;
}): Promise<typeof shiftSwapRequests.$inferSelect> {
  if (data.requesterId === data.targetId) {
    throw new AppError('VALIDATION_ERROR', 'Tidak dapat menukar shift dengan diri sendiri', 422);
  }
  const [row] = await db.insert(shiftSwapRequests).values({
    id: nanoid(),
    requesterId: data.requesterId,
    requesterDate: data.requesterDate,
    targetId: data.targetId,
    targetDate: data.targetDate,
    reason: data.reason,
    status: 'PENDING',
  }).returning();
  return row;
}

/**
 * Approve a swap: exchange the shiftId of the requester's schedule on
 * requesterDate with the target's schedule on targetDate, atomically. Both
 * schedule rows must exist.
 */
export async function approveSwap(id: string, reviewerUserId: string): Promise<typeof shiftSwapRequests.$inferSelect | null> {
  return db.transaction(async (tx) => {
    const [req] = await tx.select().from(shiftSwapRequests).where(eq(shiftSwapRequests.id, id)).limit(1);
    if (!req) return null;
    if (req.status !== 'PENDING') {
      throw new AppError('VALIDATION_ERROR', 'Permintaan tukar shift sudah diproses', 409);
    }

    const [reqSched] = await tx.select().from(employeeSchedules)
      .where(and(eq(employeeSchedules.employeeId, req.requesterId), eq(employeeSchedules.date, req.requesterDate))).limit(1);
    const [tgtSched] = await tx.select().from(employeeSchedules)
      .where(and(eq(employeeSchedules.employeeId, req.targetId), eq(employeeSchedules.date, req.targetDate))).limit(1);
    if (!reqSched || !tgtSched) {
      throw new AppError('NOT_FOUND', 'Jadwal salah satu karyawan tidak ditemukan untuk tanggal tersebut', 404);
    }

    await tx.update(employeeSchedules).set({ shiftId: tgtSched.shiftId, updatedAt: new Date() }).where(eq(employeeSchedules.id, reqSched.id));
    await tx.update(employeeSchedules).set({ shiftId: reqSched.shiftId, updatedAt: new Date() }).where(eq(employeeSchedules.id, tgtSched.id));

    const [updated] = await tx.update(shiftSwapRequests).set({
      status: 'APPROVED', reviewedBy: reviewerUserId, reviewedAt: new Date(), updatedAt: new Date(),
    }).where(eq(shiftSwapRequests.id, id)).returning();
    return updated;
  });
}

export async function rejectSwap(id: string, reviewerUserId: string, reason: string): Promise<typeof shiftSwapRequests.$inferSelect | null> {
  const [req] = await db.select().from(shiftSwapRequests).where(eq(shiftSwapRequests.id, id)).limit(1);
  if (!req) return null;
  if (req.status !== 'PENDING') {
    throw new AppError('VALIDATION_ERROR', 'Permintaan tukar shift sudah diproses', 409);
  }
  const [row] = await db.update(shiftSwapRequests).set({
    status: 'REJECTED', rejectionReason: reason, reviewedBy: reviewerUserId, reviewedAt: new Date(), updatedAt: new Date(),
  }).where(eq(shiftSwapRequests.id, id)).returning();
  return row;
}

export async function listSwaps(filters?: { status?: ShiftSwapStatus }): Promise<Array<typeof shiftSwapRequests.$inferSelect>> {
  const where = filters?.status ? eq(shiftSwapRequests.status, filters.status) : undefined;
  return db.select().from(shiftSwapRequests).where(where).orderBy(desc(shiftSwapRequests.createdAt));
}

export async function getSwapsForEmployee(employeeId: string): Promise<Array<typeof shiftSwapRequests.$inferSelect>> {
  return db.select().from(shiftSwapRequests)
    .where(or(eq(shiftSwapRequests.requesterId, employeeId), eq(shiftSwapRequests.targetId, employeeId)))
    .orderBy(desc(shiftSwapRequests.createdAt));
}
