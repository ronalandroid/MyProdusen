export type LeaveBalanceTransactionType =
  | 'ENTITLEMENT'
  | 'CARRY_FORWARD'
  | 'REQUEST_HOLD'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED_RELEASE'
  | 'MANUAL_ADJUSTMENT'
  | 'EXPIRY';

export interface LeaveLedgerEntry {
  transactionType: LeaveBalanceTransactionType;
  amount: number;
}

export interface LeaveBalanceSummary {
  entitlement: number;
  used: number;
  pending: number;
  available: number;
}

export function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

export function summarizeLeaveLedger(entries: LeaveLedgerEntry[]): LeaveBalanceSummary {
  const entitlement = entries
    .filter((entry) => ['ENTITLEMENT', 'CARRY_FORWARD', 'MANUAL_ADJUSTMENT', 'EXPIRY'].includes(entry.transactionType))
    .reduce((total, entry) => total + entry.amount, 0);
  const used = Math.abs(entries
    .filter((entry) => entry.transactionType === 'REQUEST_APPROVED')
    .reduce((total, entry) => total + entry.amount, 0));
  const pendingBalance = entries
    .filter((entry) => ['REQUEST_HOLD', 'REQUEST_REJECTED_RELEASE', 'REQUEST_APPROVED'].includes(entry.transactionType))
    .reduce((total, entry) => {
      if (entry.transactionType === 'REQUEST_APPROVED') return total + Math.abs(entry.amount);
      return total + entry.amount;
    }, 0);
  const pending = Math.abs(Math.min(0, pendingBalance));
  const available = entries.reduce((total, entry) => total + entry.amount, 0);

  return { entitlement, used, pending, available };
}
