import { afterAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { GET as divisionsGET, POST as divisionsPOST } from '@/app/api/divisions/route';
import { PUT as divisionPUT, DELETE as divisionDELETE } from '@/app/api/divisions/[id]/route';
import { GET as registerOptionsGET } from '@/app/api/auth/register-options/route';
import { db, divisions } from '@/lib/db';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';

/**
 * /api/divisions is SUPERADMIN-only (DIVISION_* permissions). The public
 * register form gets its division options via /api/auth/register-options,
 * which must now serve the MANAGED division list — so a brand-new division
 * with zero employees appears immediately (kebijakan owner 2026-07-19).
 */
const createdDivisionIds: string[] = [];
const userIds: string[] = [];

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

afterAll(async () => {
  await cleanupTestData({ userIds });
  if (createdDivisionIds.length) {
    await db.delete(divisions).where(inArray(divisions.id, createdDivisionIds));
  }
});

describe('divisions routes auth', () => {
  it('GET/POST/PUT/DELETE: 401 without authentication', async () => {
    expect((await divisionsGET(createMockRequest('GET', 'http://localhost:3000/api/divisions', {}) as never)).status).toBe(401);
    expect((await divisionsPOST(createMockRequest('POST', 'http://localhost:3000/api/divisions', { body: { name: 'X' } }) as never)).status).toBe(401);
    expect((await divisionPUT(createMockRequest('PUT', 'http://localhost:3000/api/divisions/x', { body: { name: 'X' } }) as never, params('x') as never)).status).toBe(401);
    expect((await divisionDELETE(createMockRequest('DELETE', 'http://localhost:3000/api/divisions/x', {}) as never, params('x') as never)).status).toBe(401);
  });

  it('POST/DELETE: 403 for EMPLOYEE', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    expect((await divisionsPOST(createMockRequest('POST', 'http://localhost:3000/api/divisions', { token: emp.token, body: { name: 'X' } }) as never)).status).toBe(403);
    expect((await divisionDELETE(createMockRequest('DELETE', 'http://localhost:3000/api/divisions/x', { token: emp.token }) as never, params('x') as never)).status).toBe(403);
  });
});

describe('divisions routes as SUPERADMIN', () => {
  it('POST creates, GET lists, DELETE removes an empty division', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const name = `Divisi Rute ${Date.now()}`;

    const createRes = await divisionsPOST(
      createMockRequest('POST', 'http://localhost:3000/api/divisions', { token: admin.token, body: { name } }) as never,
    );
    expect(createRes.status).toBe(200);
    const created = (await createRes.json()).data;
    createdDivisionIds.push(created.id);
    expect(created.name).toBe(name);

    const listRes = await divisionsGET(
      createMockRequest('GET', 'http://localhost:3000/api/divisions', { token: admin.token }) as never,
    );
    const list = (await listRes.json()).data as Array<{ id: string }>;
    expect(list.some((d) => d.id === created.id)).toBe(true);

    const deleteRes = await divisionDELETE(
      createMockRequest('DELETE', `http://localhost:3000/api/divisions/${created.id}`, { token: admin.token }) as never,
      params(created.id) as never,
    );
    expect(deleteRes.status).toBe(200);
  });

  it('POST rejects an invalid payload with 4xx', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const res = await divisionsPOST(
      createMockRequest('POST', 'http://localhost:3000/api/divisions', { token: admin.token, body: { name: 'x' } }) as never,
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

describe('register-options serves the managed division list', () => {
  it('includes a freshly created division that has zero employees, and hides inactive ones', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);

    const emptyName = `Divisi Baru Kosong ${Date.now()}`;
    const createRes = await divisionsPOST(
      createMockRequest('POST', 'http://localhost:3000/api/divisions', { token: admin.token, body: { name: emptyName } }) as never,
    );
    const created = (await createRes.json()).data;
    createdDivisionIds.push(created.id);

    const inactiveName = `Divisi Baru Nonaktif ${Date.now()}`;
    const createRes2 = await divisionsPOST(
      createMockRequest('POST', 'http://localhost:3000/api/divisions', { token: admin.token, body: { name: inactiveName } }) as never,
    );
    const inactive = (await createRes2.json()).data;
    createdDivisionIds.push(inactive.id);
    await divisionPUT(
      createMockRequest('PUT', `http://localhost:3000/api/divisions/${inactive.id}`, { token: admin.token, body: { isActive: false } }) as never,
      params(inactive.id) as never,
    );

    const optionsRes = await registerOptionsGET(createMockRequest('GET', 'http://localhost:3000/api/auth/register-options', {}) as never);
    expect(optionsRes.status).toBe(200);
    const options = (await optionsRes.json()).data as { divisions: string[] };
    expect(options.divisions).toContain(emptyName);
    expect(options.divisions).not.toContain(inactiveName);
  });
});
