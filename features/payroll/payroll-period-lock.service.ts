import { db, payrollRuns } from '@/lib/db';
import { and, gte, lte } from 'drizzle-orm';
import { isPayrollStatusLocked } from '@/lib/payroll/period-lock';

export class PayrollPeriodLockService {
  async getLockedPeriodForDate(date: Date) {
    const [run] = await db
      .select()
      .from(payrollRuns)
      .where(and(
        lte(payrollRuns.periodStart, date),
        gte(payrollRuns.periodEnd, date)
      ))
      .limit(1);

    if (!run || !isPayrollStatusLocked(run.status)) {
      return null;
    }

    return run;
  }

  async assertAttendanceDateEditable(date: Date, overrideReason?: string) {
    const lockedRun = await this.getLockedPeriodForDate(date);

    if (!lockedRun) {
      return;
    }

    if (overrideReason && overrideReason.trim().length >= 10) {
      return;
    }

    throw new Error(`Periode payroll ${lockedRun.period} sudah dikunci. Perubahan absensi membutuhkan alasan override minimal 10 karakter.`);
  }
}

export const payrollPeriodLockService = new PayrollPeriodLockService();
