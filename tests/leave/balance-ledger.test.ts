import { describe, expect, it } from 'vitest';
import { calculateLeaveDays, summarizeLeaveLedger } from '@/lib/leave/balance-ledger';

describe('leave balance ledger', () => {
  it('calculates inclusive leave days', () => {
    expect(calculateLeaveDays(new Date('2026-05-15'), new Date('2026-05-17'))).toBe(3);
  });

  it('summarizes entitlement, held, approved, and release transactions', () => {
    const summary = summarizeLeaveLedger([
      { transactionType: 'ENTITLEMENT', amount: 12 },
      { transactionType: 'REQUEST_APPROVED', amount: -2 },
      { transactionType: 'REQUEST_REJECTED_RELEASE', amount: 1 },
    ]);

    expect(summary).toEqual({ entitlement: 12, used: 2, pending: 0, available: 11 });
  });

  it('supports append-only approval by releasing hold and recording approved usage', () => {
    const summary = summarizeLeaveLedger([
      { transactionType: 'ENTITLEMENT', amount: 12 },
      { transactionType: 'REQUEST_HOLD', amount: -2 },
      { transactionType: 'REQUEST_REJECTED_RELEASE', amount: 2 },
      { transactionType: 'REQUEST_APPROVED', amount: -2 },
    ]);

    expect(summary).toEqual({ entitlement: 12, used: 2, pending: 0, available: 10 });
  });

  it('does not count pending holds as used leave', () => {
    const summary = summarizeLeaveLedger([
      { transactionType: 'ENTITLEMENT', amount: 12 },
      { transactionType: 'REQUEST_HOLD', amount: -2 },
    ]);

    expect(summary).toEqual({ entitlement: 12, used: 0, pending: 2, available: 10 });
  });

  it('treats manual quota adjustments as append-only entitlement changes', () => {
    const summary = summarizeLeaveLedger([
      { transactionType: 'ENTITLEMENT', amount: 12 },
      { transactionType: 'MANUAL_ADJUSTMENT', amount: -2 },
      { transactionType: 'REQUEST_APPROVED', amount: -1 },
    ]);

    expect(summary).toEqual({ entitlement: 10, used: 1, pending: 0, available: 9 });
  });
});
