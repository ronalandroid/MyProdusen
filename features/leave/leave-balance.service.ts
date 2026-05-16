import { db, leaveBalanceLedger } from '@/lib/db';
import { and, eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { calculateLeaveDays, summarizeLeaveLedger, type LeaveBalanceTransactionType } from '@/lib/leave/balance-ledger';

export class LeaveBalanceService {
  async ensureAnnualEntitlement(employeeId: string, year = new Date().getFullYear(), createdBy?: string) {
    const [existing] = await db
      .select()
      .from(leaveBalanceLedger)
      .where(and(
        eq(leaveBalanceLedger.employeeId, employeeId),
        eq(leaveBalanceLedger.balanceYear, year),
        eq(leaveBalanceLedger.transactionType, 'ENTITLEMENT')
      ))
      .limit(1);

    if (existing) return existing;

    const [created] = await db.insert(leaveBalanceLedger).values({
      id: uuidv4(),
      employeeId,
      transactionType: 'ENTITLEMENT',
      amount: 12,
      balanceYear: year,
      reason: `Jatah cuti tahunan ${year}`,
      createdBy,
    }).returning();

    return created;
  }

  async holdForRequest(data: { employeeId: string; leaveRequestId: string; startDate: Date; endDate: Date; createdBy?: string }) {
    const year = data.startDate.getFullYear();
    await this.ensureAnnualEntitlement(data.employeeId, year, data.createdBy);
    const days = calculateLeaveDays(data.startDate, data.endDate);

    const [created] = await db.insert(leaveBalanceLedger).values({
      id: uuidv4(),
      employeeId: data.employeeId,
      leaveRequestId: data.leaveRequestId,
      transactionType: 'REQUEST_HOLD',
      amount: -days,
      balanceYear: year,
      reason: `Hold pengajuan cuti ${data.leaveRequestId}`,
      createdBy: data.createdBy,
    }).returning();

    return created;
  }

  async approveRequest(leaveRequestId: string, createdBy?: string) {
    const [updated] = await db
      .update(leaveBalanceLedger)
      .set({ transactionType: 'REQUEST_APPROVED' })
      .where(and(
        eq(leaveBalanceLedger.leaveRequestId, leaveRequestId),
        eq(leaveBalanceLedger.transactionType, 'REQUEST_HOLD')
      ))
      .returning();

    return updated;
  }

  async releaseRejectedRequest(leaveRequestId: string, createdBy?: string) {
    const [hold] = await db
      .select()
      .from(leaveBalanceLedger)
      .where(and(
        eq(leaveBalanceLedger.leaveRequestId, leaveRequestId),
        eq(leaveBalanceLedger.transactionType, 'REQUEST_HOLD')
      ))
      .limit(1);

    if (!hold) return null;

    const [release] = await db.insert(leaveBalanceLedger).values({
      id: uuidv4(),
      employeeId: hold.employeeId,
      leaveRequestId,
      transactionType: 'REQUEST_REJECTED_RELEASE',
      amount: Math.abs(hold.amount),
      balanceYear: hold.balanceYear,
      reason: `Release pengajuan ditolak ${leaveRequestId}`,
      createdBy,
    }).returning();

    return release;
  }

  async getBalance(employeeId: string, year = new Date().getFullYear()) {
    await this.ensureAnnualEntitlement(employeeId, year);
    const entries = await db
      .select({ transactionType: leaveBalanceLedger.transactionType, amount: leaveBalanceLedger.amount })
      .from(leaveBalanceLedger)
      .where(and(eq(leaveBalanceLedger.employeeId, employeeId), eq(leaveBalanceLedger.balanceYear, year)));

    return { year, ...summarizeLeaveLedger(entries as Array<{ transactionType: LeaveBalanceTransactionType; amount: number }>) };
  }

  async getBalanceHistory(employeeId: string, year = new Date().getFullYear()) {
    await this.ensureAnnualEntitlement(employeeId, year);
    
    const history = await db
      .select()
      .from(leaveBalanceLedger)
      .where(and(
        eq(leaveBalanceLedger.employeeId, employeeId),
        eq(leaveBalanceLedger.balanceYear, year)
      ))
      .orderBy(desc(leaveBalanceLedger.createdAt));

    return history;
  }
}

export const leaveBalanceService = new LeaveBalanceService();
