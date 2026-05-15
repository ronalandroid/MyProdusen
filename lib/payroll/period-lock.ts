export type PayrollRunStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';

export function isPayrollStatusLocked(status: PayrollRunStatus | string): boolean {
  return status === 'APPROVED' || status === 'PAID';
}

export function isDateInsidePayrollPeriod(date: Date, periodStart: Date, periodEnd: Date): boolean {
  const target = stripTime(date).getTime();
  const start = stripTime(periodStart).getTime();
  const end = stripTime(periodEnd).getTime();
  return target >= start && target <= end;
}

function stripTime(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
