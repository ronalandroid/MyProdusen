import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db, payrollDisputes, payrollItems, payrollRuns, notifications } from '@/lib/db';
import { payrollDisputeService } from '@/services/payroll/payroll-dispute.service';
import { createTestEmployee, createTestUser, cleanupTestData } from '../helpers/test-utils';

let admin: Awaited<ReturnType<typeof createTestUser>>;
let worker: Awaited<ReturnType<typeof createTestUser>>;
let otherWorker: Awaited<ReturnType<typeof createTestUser>>;
let employeeId: string;
let otherEmployeeId: string;
let payrollItemId: string;
const PERIOD = '2026-06';
const createdRunIds: string[] = [];

function suffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedPayrollItem(empId: string) {
  const s = suffix();
  const rId = `test_run_${s}`;
  createdRunIds.push(rId);
  await db.insert(payrollRuns).values({
    id: rId,
    period: `${PERIOD}-${s}`,
    periodStart: new Date('2026-06-01'),
    periodEnd: new Date('2026-06-30'),
    status: 'APPROVED',
  });
  const itemId = `test_pi_${s}`;
  await db.insert(payrollItems).values({
    id: itemId,
    runId: rId,
    employeeId: empId,
    baseSalary: 3_000_000,
    grossPay: 3_000_000,
    netPay: 2_800_000,
  });
  return { itemId };
}

beforeAll(async () => {
  admin = await createTestUser('SUPERADMIN');
  worker = await createTestUser('EMPLOYEE');
  otherWorker = await createTestUser('EMPLOYEE');
  employeeId = await createTestEmployee(worker.id);
  otherEmployeeId = await createTestEmployee(otherWorker.id);
  ({ itemId: payrollItemId } = await seedPayrollItem(employeeId));
});

afterEach(async () => {
  await db.delete(payrollDisputes).where(eq(payrollDisputes.employeeId, employeeId));
  await db.delete(payrollDisputes).where(eq(payrollDisputes.employeeId, otherEmployeeId));
  await db.delete(notifications).where(eq(notifications.userId, admin.id));
});

afterAll(async () => {
  for (const rId of createdRunIds) {
    await db.delete(payrollItems).where(eq(payrollItems.runId, rId));
    await db.delete(payrollRuns).where(eq(payrollRuns.id, rId));
  }
  await db.delete(notifications).where(eq(notifications.userId, admin.id));
  await cleanupTestData({ userIds: [admin.id, worker.id, otherWorker.id], employeeIds: [employeeId, otherEmployeeId] });
});

describe('payroll dispute (Adukan Ketidaksesuaian Gaji)', () => {
  it('rejects a too-short reason', async () => {
    await expect(
      payrollDisputeService.createDispute({ payrollItemId, employeeId, reason: 'salah', requestedByUserId: worker.id }),
    ).rejects.toThrow(/minimal 10 karakter/);
  });

  it('creates a PENDING dispute and notifies superadmin', async () => {
    const dispute = await payrollDisputeService.createDispute({
      payrollItemId,
      employeeId,
      reason: 'Lembur bulan Juni belum masuk hitungan slip gaji saya',
      requestedByUserId: worker.id,
    });
    expect(dispute.status).toBe('PENDING');
    expect(dispute.period).toContain(PERIOD); // captured from the payroll run

    const adminNotifs = await db.select().from(notifications).where(eq(notifications.userId, admin.id));
    expect(adminNotifs.some((n) => n.title.includes('Aduan ketidaksesuaian gaji'))).toBe(true);
  });

  it("forbids disputing another employee's payslip", async () => {
    await expect(
      payrollDisputeService.createDispute({
        payrollItemId,
        employeeId: otherEmployeeId,
        reason: 'Mencoba mengadukan slip milik orang lain',
        requestedByUserId: otherWorker.id,
      }),
    ).rejects.toThrow(/milik sendiri/);
  });

  it('prevents a second open dispute on the same payslip', async () => {
    await payrollDisputeService.createDispute({
      payrollItemId, employeeId, reason: 'Potongan kasbon kelihatannya dobel bulan ini', requestedByUserId: worker.id,
    });
    await expect(
      payrollDisputeService.createDispute({
        payrollItemId, employeeId, reason: 'Aduan kedua untuk slip yang sama', requestedByUserId: worker.id,
      }),
    ).rejects.toThrow(/sedang ditinjau/);
  });

  it('resolves a dispute, notifies the employee, and blocks double-review', async () => {
    const dispute = await payrollDisputeService.createDispute({
      payrollItemId, employeeId, reason: 'Tunjangan kehadiran kurang dari seharusnya', requestedByUserId: worker.id,
    });

    const resolved = await payrollDisputeService.reviewDispute({
      id: dispute.id, reviewerUserId: admin.id, status: 'RESOLVED', reviewNote: 'Sudah dikoreksi, selisih dibayar tunai minggu ini',
    });
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.reviewedBy).toBe(admin.id);

    const empNotifs = await db.select().from(notifications).where(eq(notifications.userId, worker.id));
    expect(empNotifs.some((n) => n.title.includes('disetujui'))).toBe(true);

    await expect(
      payrollDisputeService.reviewDispute({ id: dispute.id, reviewerUserId: admin.id, status: 'REJECTED', reviewNote: 'coba tolak lagi' }),
    ).rejects.toThrow(/sudah diproses/);
  });

  it('employee listing only returns their own disputes', async () => {
    await payrollDisputeService.createDispute({
      payrollItemId, employeeId, reason: 'Aduan milik pelapor untuk uji isolasi listing', requestedByUserId: worker.id,
    });
    const { itemId: otherItem } = await seedPayrollItem(otherEmployeeId);
    await payrollDisputeService.createDispute({
      payrollItemId: otherItem, employeeId: otherEmployeeId, reason: 'Aduan milik karyawan lain', requestedByUserId: otherWorker.id,
    });

    const mine = await payrollDisputeService.listDisputes({ viewerRole: 'EMPLOYEE', viewerEmployeeId: employeeId });
    expect(mine.length).toBe(1);
    expect(mine[0].dispute.employeeId).toBe(employeeId);

    const adminView = await payrollDisputeService.listDisputes({ viewerRole: 'SUPERADMIN' });
    expect(adminView.length).toBeGreaterThanOrEqual(2);

    await db.delete(payrollItems).where(eq(payrollItems.id, otherItem));
  });
});
