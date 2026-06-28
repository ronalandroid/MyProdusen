import { describe, it, expect, afterEach } from 'vitest';
import { POST as requestRoute, GET as listRoute } from '@/app/api/payroll/cash-advances/route';
import { POST as approveRoute } from '@/app/api/payroll/cash-advances/[id]/approve/route';
import { POST as rejectRoute } from '@/app/api/payroll/cash-advances/[id]/reject/route';
import { GET as myRoute } from '@/app/api/payroll/cash-advances/me/route';
import { createTestUser, createTestEmployee, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { db, cashAdvances } from '@/lib/db';
import { inArray } from 'drizzle-orm';

const URL_BASE = 'http://localhost:3000/api/payroll/cash-advances';
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('cash-advances routes', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];

  afterEach(async () => {
    if (employeeIds.length) await db.delete(cashAdvances).where(inArray(cashAdvances.employeeId, employeeIds));
    await cleanupTestData({ employeeIds, userIds });
    userIds.length = 0;
    employeeIds.length = 0;
  });

  it('401 without authentication', async () => {
    const res = await requestRoute(createMockRequest('POST', URL_BASE, { body: { amount: 100000, reason: 'butuh dana' } }) as never);
    expect(res.status).toBe(401);
  });

  it('employee requests -> admin lists -> admin approves -> employee sees own', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const empId = await createTestEmployee(emp.id);
    employeeIds.push(empId);

    const reqRes = await requestRoute(createMockRequest('POST', URL_BASE, {
      token: emp.token, body: { amount: 2_000_000, reason: 'biaya sekolah anak', installments: 2 },
    }) as never);
    expect(reqRes.status).toBe(201);
    const advanceId = (await reqRes.json()).data.id as string;

    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);

    const listRes = await listRoute(createMockRequest('GET', URL_BASE, { token: admin.token }) as never);
    expect(listRes.status).toBe(200);

    const approveRes = await approveRoute(
      createMockRequest('POST', `${URL_BASE}/${advanceId}/approve`, { token: admin.token }) as never,
      params(advanceId),
    );
    expect(approveRes.status).toBe(200);
    const approved = (await approveRes.json()).data;
    expect(approved.status).toBe('APPROVED');
    expect(approved.monthlyDeduction).toBe(1_000_000);

    const meRes = await myRoute(createMockRequest('GET', `${URL_BASE}/me`, { token: emp.token }) as never);
    expect(meRes.status).toBe(200);
    expect((await meRes.json()).data.length).toBeGreaterThanOrEqual(1);
  });

  it('forbids a non-admin from listing all advances, and rejects a pending one', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const empId = await createTestEmployee(emp.id);
    employeeIds.push(empId);

    const listRes = await listRoute(createMockRequest('GET', URL_BASE, { token: emp.token }) as never);
    expect(listRes.status).toBe(403);

    const reqRes = await requestRoute(createMockRequest('POST', URL_BASE, {
      token: emp.token, body: { amount: 500_000, reason: 'keperluan mendadak' },
    }) as never);
    const advanceId = (await reqRes.json()).data.id as string;

    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const rejectRes = await rejectRoute(
      createMockRequest('POST', `${URL_BASE}/${advanceId}/reject`, { token: admin.token, body: { reason: 'Plafon terlampaui' } }) as never,
      params(advanceId),
    );
    expect(rejectRes.status).toBe(200);
    expect((await rejectRes.json()).data.status).toBe('REJECTED');
  });

  it('validates the request body and 404s unknown advances on approve/reject', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const empId = await createTestEmployee(emp.id);
    employeeIds.push(empId);

    // amount <= 0 fails the Zod schema -> 422
    const bad = await requestRoute(createMockRequest('POST', URL_BASE, {
      token: emp.token, body: { amount: 0, reason: 'alasan cukup panjang' },
    }) as never);
    expect(bad.status).toBe(422);

    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);

    const approveMissing = await approveRoute(
      createMockRequest('POST', `${URL_BASE}/itest-nope/approve`, { token: admin.token }) as never,
      params('itest-nope'),
    );
    expect(approveMissing.status).toBe(404);

    const rejectMissing = await rejectRoute(
      createMockRequest('POST', `${URL_BASE}/itest-nope/reject`, { token: admin.token, body: { reason: 'tidak ditemukan tes' } }) as never,
      params('itest-nope'),
    );
    expect(rejectMissing.status).toBe(404);
  });

  it('admin filters by status, and /me 404s a user without an employee profile', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const filtered = await listRoute(createMockRequest('GET', `${URL_BASE}?status=PENDING`, { token: admin.token }) as never);
    expect(filtered.status).toBe(200);

    // user with no employee record -> /me resolves no profile -> 404
    const orphan = await createTestUser('EMPLOYEE');
    userIds.push(orphan.id);
    const meRes = await myRoute(createMockRequest('GET', `${URL_BASE}/me`, { token: orphan.token }) as never);
    expect(meRes.status).toBe(404);
  });
});
