import { describe, expect, it } from 'vitest';
import { calculateLeaveDays, summarizeLeaveLedger } from '@/lib/leave/balance-ledger';

describe('leave balance ledger', () => {
  it('calculates inclusive leave days', () => {
    expect(calculateLeaveDays(new Date('2026-05-15'), new Date('2026-05-17'))).toBe(3);
  });

  it('summarizes entitlement, held, approved, and release transactions', () => {
    const summary = summarizeLeaveLedger([
      { transactionType: 'ENTITLEMENT', amount: 12 },
      { transactionType: 'REQUEST_HOLD', amount: -2 },
      { transactionType: 'REQUEST_APPROVED', amount: 0 },
      { transactionType: 'REQUEST_REJECTED_RELEASE', amount: 1 },
    ]);

    expect(summary).toEqual({ entitlement: 12, used: 2, pending: 2, available: 11 });
  });
});
