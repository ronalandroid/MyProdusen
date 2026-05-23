import { db, leaveBalanceLedger, companySettings, employees } from '@/lib/db';
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

    // Load global quota dynamically
    const globalQuota = await this.getGlobalLeaveQuota();

    const [created] = await db.insert(leaveBalanceLedger).values({
      id: uuidv4(),
      employeeId,
      transactionType: 'ENTITLEMENT',
      amount: globalQuota,
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
    const [hold] = await db
      .select()
      .from(leaveBalanceLedger)
      .where(and(
        eq(leaveBalanceLedger.leaveRequestId, leaveRequestId),
        eq(leaveBalanceLedger.transactionType, 'REQUEST_HOLD')
      ))
      .limit(1);

    if (!hold) return null;

    const [existingApproval] = await db
      .select()
      .from(leaveBalanceLedger)
      .where(and(
        eq(leaveBalanceLedger.leaveRequestId, leaveRequestId),
        eq(leaveBalanceLedger.transactionType, 'REQUEST_APPROVED')
      ))
      .limit(1);

    if (existingApproval) return existingApproval;

    await db.insert(leaveBalanceLedger).values({
      id: uuidv4(),
      employeeId: hold.employeeId,
      leaveRequestId,
      transactionType: 'REQUEST_REJECTED_RELEASE',
      amount: Math.abs(hold.amount),
      balanceYear: hold.balanceYear,
      reason: `Release hold approval ${leaveRequestId}`,
      createdBy,
    });

    const [approved] = await db.insert(leaveBalanceLedger).values({
      id: uuidv4(),
      employeeId: hold.employeeId,
      leaveRequestId,
      transactionType: 'REQUEST_APPROVED',
      amount: -Math.abs(hold.amount),
      balanceYear: hold.balanceYear,
      reason: `Cuti disetujui ${leaveRequestId}`,
      createdBy,
    }).returning();

    return approved;
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

  // ============================================
  // GLOBAL & INDIVIDUAL LEAVE SETTINGS
  // ============================================

  async getGlobalLeaveQuota(): Promise<number> {
    const [setting] = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.key, 'DEFAULT_LEAVE_QUOTA'))
      .limit(1);

    if (!setting) return 12;
    const val = parseInt(setting.value, 10);
    return isNaN(val) ? 12 : val;
  }

  async updateGlobalLeaveQuota(actorUserId: string, quota: number) {
    const [existing] = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.key, 'DEFAULT_LEAVE_QUOTA'))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(companySettings)
        .set({
          value: quota.toString(),
          updatedBy: actorUserId,
          updatedAt: new Date(),
        })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(companySettings)
        .values({
          id: uuidv4(),
          key: 'DEFAULT_LEAVE_QUOTA',
          value: quota.toString(),
          description: 'Default annual leave entitlement for employees',
          updatedBy: actorUserId,
        })
        .returning();
      return created;
    }
  }

  async syncGlobalQuota(actorUserId: string, year = new Date().getFullYear()) {
    const quota = await this.getGlobalLeaveQuota();

    const activeEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.status, 'ACTIVE'));

    for (const emp of activeEmployees) {
      const entries = await db
        .select({ transactionType: leaveBalanceLedger.transactionType, amount: leaveBalanceLedger.amount })
        .from(leaveBalanceLedger)
        .where(and(
          eq(leaveBalanceLedger.employeeId, emp.id),
          eq(leaveBalanceLedger.balanceYear, year)
        ));

      const summary = summarizeLeaveLedger(entries as Array<{ transactionType: LeaveBalanceTransactionType; amount: number }>);

      if (entries.length === 0) {
        await db.insert(leaveBalanceLedger).values({
          id: uuidv4(),
          employeeId: emp.id,
          transactionType: 'ENTITLEMENT',
          amount: quota,
          balanceYear: year,
          reason: `Jatah cuti tahunan ${year}`,
          createdBy: actorUserId,
        });
        continue;
      }

      const delta = quota - summary.entitlement;
      if (delta !== 0) {
        await db.insert(leaveBalanceLedger).values({
          id: uuidv4(),
          employeeId: emp.id,
          transactionType: 'MANUAL_ADJUSTMENT',
          amount: delta,
          balanceYear: year,
          reason: `Sinkron jatah cuti global ${year} ke ${quota}`,
          createdBy: actorUserId,
        });
      }
    }
  }

  async adjustIndividualQuota(actorUserId: string, employeeId: string, quota: number, year = new Date().getFullYear(), reason = 'Koreksi jatah cuti individu') {
    const entries = await db
      .select({ transactionType: leaveBalanceLedger.transactionType, amount: leaveBalanceLedger.amount })
      .from(leaveBalanceLedger)
      .where(and(
        eq(leaveBalanceLedger.employeeId, employeeId),
        eq(leaveBalanceLedger.balanceYear, year)
      ));

    if (entries.length === 0) {
      const [created] = await db
        .insert(leaveBalanceLedger)
        .values({
          id: uuidv4(),
          employeeId,
          transactionType: 'ENTITLEMENT',
          amount: quota,
          balanceYear: year,
          reason,
          createdBy: actorUserId,
        })
        .returning();
      return created;
    }

    const summary = summarizeLeaveLedger(entries as Array<{ transactionType: LeaveBalanceTransactionType; amount: number }>);
    const delta = quota - summary.entitlement;
    const [created] = await db
      .insert(leaveBalanceLedger)
      .values({
        id: uuidv4(),
        employeeId,
        transactionType: 'MANUAL_ADJUSTMENT',
        amount: delta,
        balanceYear: year,
        reason,
        createdBy: actorUserId,
      })
      .returning();
    return created;
  }
}

export const leaveBalanceService = new LeaveBalanceService();
