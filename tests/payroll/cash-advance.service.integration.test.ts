import { describe, it, expect, afterEach } from 'vitest';
import { db, cashAdvances } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { createTestUser, createTestEmployee, cleanupTestData } from '../helpers/test-utils';
import {
  requestAdvance, approveAdvance, rejectAdvance, getActiveInstallment, settleInstallment, installmentFor,
} from '@/src/services/payroll/cash-advance.service';

describe('cash-advance (kasbon) service', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];

  afterEach(async () => {
    if (employeeIds.length) await db.delete(cashAdvances).where(inArray(cashAdvances.employeeId, employeeIds));
    await cleanupTestData({ employeeIds, userIds });
    userIds.length = 0;
    employeeIds.length = 0;
  });

  it('installmentFor splits the amount across installments (rounded)', () => {
    expect(installmentFor(3_000_000, 3)).toBe(1_000_000);
    expect(installmentFor(1_000_000, 1)).toBe(1_000_000);
    expect(installmentFor(1_000_000, 3)).toBe(333_333);
  });

  it('request -> approve sets installment + balance; settle counts down to SETTLED', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const empId = await createTestEmployee(user.id);
    employeeIds.push(empId);

    const req = await requestAdvance({ employeeId: empId, amount: 3_000_000, reason: 'Biaya sekolah anak', installments: 3, requestedBy: user.id });
    expect(req.status).toBe('PENDING');
    expect(req.remainingBalance).toBe(0);

    const approved = await approveAdvance(req.id, 'itest-admin');
    expect(approved!.status).toBe('APPROVED');
    expect(approved!.monthlyDeduction).toBe(1_000_000);
    expect(approved!.remainingBalance).toBe(3_000_000);

    expect(await getActiveInstallment(empId)).toEqual({ advanceId: req.id, deduction: 1_000_000 });

    await settleInstallment(req.id, 1_000_000);
    await settleInstallment(req.id, 1_000_000);
    expect((await getActiveInstallment(empId))!.deduction).toBe(1_000_000);

    const final = await settleInstallment(req.id, 1_000_000);
    expect(final!.remainingBalance).toBe(0);
    expect(final!.status).toBe('SETTLED');
    expect(await getActiveInstallment(empId)).toBeNull();
  });

  it('rejects a pending advance and blocks double-processing', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const empId = await createTestEmployee(user.id);
    employeeIds.push(empId);

    const req = await requestAdvance({ employeeId: empId, amount: 500_000, reason: 'keperluan mendadak', requestedBy: user.id });
    const rejected = await rejectAdvance(req.id, 'itest-admin', 'Plafon terlampaui');
    expect(rejected!.status).toBe('REJECTED');

    await expect(approveAdvance(req.id, 'itest-admin')).rejects.toThrow();
  });
});
