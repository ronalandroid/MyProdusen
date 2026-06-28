import { db } from '@/lib/db';
import { cashAdvances } from '@/drizzle/schema';
import { and, eq, gt, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { AppError } from '@/lib/core/app-error';

export type CashAdvanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED';

/** Per-installment repayment for an N-installment advance (whole rupiah). */
export function installmentFor(amount: number, installments: number): number {
  const n = Math.max(1, Math.floor(installments));
  return Math.round(amount / n);
}

export async function requestAdvance(data: {
  employeeId: string;
  amount: number;
  reason: string;
  installments?: number;
  requestedBy: string;
}): Promise<typeof cashAdvances.$inferSelect> {
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Jumlah kasbon harus lebih dari 0', 422);
  }
  const [row] = await db.insert(cashAdvances).values({
    id: nanoid(),
    employeeId: data.employeeId,
    amount: data.amount,
    reason: data.reason,
    installments: Math.max(1, Math.floor(data.installments ?? 1)),
    monthlyDeduction: 0,
    remainingBalance: 0,
    status: 'PENDING',
    requestedBy: data.requestedBy,
  }).returning();
  return row;
}

export async function approveAdvance(id: string, reviewerUserId: string): Promise<typeof cashAdvances.$inferSelect | null> {
  const [advance] = await db.select().from(cashAdvances).where(eq(cashAdvances.id, id)).limit(1);
  if (!advance) return null;
  if (advance.status !== 'PENDING') {
    throw new AppError('VALIDATION_ERROR', 'Kasbon sudah diproses', 409);
  }
  const [row] = await db.update(cashAdvances).set({
    status: 'APPROVED',
    monthlyDeduction: installmentFor(advance.amount, advance.installments),
    remainingBalance: advance.amount,
    reviewedBy: reviewerUserId,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(cashAdvances.id, id)).returning();
  return row;
}

export async function rejectAdvance(id: string, reviewerUserId: string, reason: string): Promise<typeof cashAdvances.$inferSelect | null> {
  const [advance] = await db.select().from(cashAdvances).where(eq(cashAdvances.id, id)).limit(1);
  if (!advance) return null;
  if (advance.status !== 'PENDING') {
    throw new AppError('VALIDATION_ERROR', 'Kasbon sudah diproses', 409);
  }
  const [row] = await db.update(cashAdvances).set({
    status: 'REJECTED', rejectionReason: reason, reviewedBy: reviewerUserId, reviewedAt: new Date(), updatedAt: new Date(),
  }).where(eq(cashAdvances.id, id)).returning();
  return row;
}

export async function listAdvances(filters?: { status?: CashAdvanceStatus }): Promise<Array<typeof cashAdvances.$inferSelect>> {
  const where = filters?.status ? eq(cashAdvances.status, filters.status) : undefined;
  return db.select().from(cashAdvances).where(where).orderBy(desc(cashAdvances.createdAt));
}

export async function getAdvancesForEmployee(employeeId: string): Promise<Array<typeof cashAdvances.$inferSelect>> {
  return db.select().from(cashAdvances).where(eq(cashAdvances.employeeId, employeeId)).orderBy(desc(cashAdvances.createdAt));
}

/**
 * The amount payroll should deduct this run for an employee — the installment,
 * capped at the remaining balance — across their active (APPROVED, balance>0)
 * advances. Consumed by the payroll-calculator integration (follow-up PR).
 */
export async function getActiveInstallment(employeeId: string): Promise<{ advanceId: string; deduction: number } | null> {
  const [advance] = await db
    .select()
    .from(cashAdvances)
    .where(and(
      eq(cashAdvances.employeeId, employeeId),
      eq(cashAdvances.status, 'APPROVED'),
      gt(cashAdvances.remainingBalance, 0),
    ))
    .orderBy(cashAdvances.createdAt)
    .limit(1);
  if (!advance) return null;
  return { advanceId: advance.id, deduction: Math.min(advance.monthlyDeduction, advance.remainingBalance) };
}

/** Apply a repayment; marks SETTLED when the balance reaches 0. */
export async function settleInstallment(id: string, amount: number): Promise<typeof cashAdvances.$inferSelect | null> {
  const [advance] = await db.select().from(cashAdvances).where(eq(cashAdvances.id, id)).limit(1);
  if (!advance) return null;
  const remaining = Math.max(0, advance.remainingBalance - Math.max(0, amount));
  const [row] = await db.update(cashAdvances).set({
    remainingBalance: remaining,
    status: remaining === 0 ? 'SETTLED' : advance.status,
    updatedAt: new Date(),
  }).where(eq(cashAdvances.id, id)).returning();
  return row;
}
