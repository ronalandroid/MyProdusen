import { describe, it, expect, afterEach } from 'vitest';
import { GET as listGET, POST as upsertPOST } from '@/app/api/attendance/schedules/route';
import { DELETE as scheduleDELETE } from '@/app/api/attendance/schedules/[id]/route';
import { GET as shiftLocGET, PUT as shiftLocPUT } from '@/app/api/attendance/shift-locations/[shiftId]/route';
import {
  createTestUser,
  createTestEmployee,
  createTestWorkLocation,
  createTestShift,
  createMockRequest,
  cleanupTestData,
} from '../helpers/test-utils';
import { db, employeeSchedules, scheduleLocations, shiftLocations } from '@/lib/db';
import { eq } from 'drizzle-orm';

const BASE = 'http://localhost:3000';

function ctx<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}

describe('Superadmin attendance scheduling API', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const locationIds: string[] = [];
  const shiftIds: string[] = [];

  afterEach(async () => {
    for (const employeeId of employeeIds) {
      const rows = await db
        .select({ id: employeeSchedules.id })
        .from(employeeSchedules)
        .where(eq(employeeSchedules.employeeId, employeeId));
      for (const row of rows) {
        await db.delete(scheduleLocations).where(eq(scheduleLocations.scheduleId, row.id));
      }
      await db.delete(employeeSchedules).where(eq(employeeSchedules.employeeId, employeeId));
    }
    for (const shiftId of shiftIds) {
      await db.delete(shiftLocations).where(eq(shiftLocations.shiftId, shiftId));
    }

    await cleanupTestData({ employeeIds, userIds, locationIds, shiftIds });
    userIds.length = 0;
    employeeIds.length = 0;
    locationIds.length = 0;
    shiftIds.length = 0;
  });

  async function setupSuperadmin() {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    return admin;
  }

  async function setupEmployee() {
    const empUser = await createTestUser('EMPLOYEE');
    userIds.push(empUser.id);
    const employeeId = await createTestEmployee(empUser.id);
    employeeIds.push(employeeId);
    return employeeId;
  }

  it('rejects non-superadmin from assigning schedules', async () => {
    const empUser = await createTestUser('EMPLOYEE');
    userIds.push(empUser.id);
    const request = createMockRequest('POST', `${BASE}/api/attendance/schedules`, {
      token: empUser.token,
      body: { employeeId: 'x', shiftId: 'y', date: '2025-01-01', workLocationIds: ['z'] },
    });
    const res = await upsertPOST(request as any);
    expect(res.status).toBe(403);
  });

  it('rejects upsert with no work locations (validation)', async () => {
    const admin = await setupSuperadmin();
    const employeeId = await setupEmployee();
    const shiftId = await createTestShift();
    shiftIds.push(shiftId);

    const request = createMockRequest('POST', `${BASE}/api/attendance/schedules`, {
      token: admin.token,
      body: { employeeId, shiftId, date: '2025-06-10', workLocationIds: [] },
    });
    const res = await upsertPOST(request as any);
    expect(res.status).toBe(422);
  });

  it('assigns a per-day schedule with multiple valid locations and lists it', async () => {
    const admin = await setupSuperadmin();
    const employeeId = await setupEmployee();
    const shiftId = await createTestShift();
    shiftIds.push(shiftId);
    const locA = await createTestWorkLocation();
    const locB = await createTestWorkLocation();
    locationIds.push(locA, locB);

    const date = '2025-06-12';
    const createReq = createMockRequest('POST', `${BASE}/api/attendance/schedules`, {
      token: admin.token,
      body: { employeeId, shiftId, date, workLocationIds: [locA, locB] },
    });
    const createRes = await upsertPOST(createReq as any);
    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    expect(created.success).toBe(true);
    expect(created.data.source).toBe('schedule');
    expect(created.data.locations.map((l: any) => l.id).sort()).toEqual([locA, locB].sort());

    const listReq = createMockRequest(
      'GET',
      `${BASE}/api/attendance/schedules?from=${date}&to=${date}&employeeId=${employeeId}`,
      { token: admin.token },
    );
    const listRes = await listGET(listReq as any);
    expect(listRes.status).toBe(200);
    const listed = await listRes.json();
    expect(listed.data.schedules).toHaveLength(1);
    expect(listed.data.schedules[0].date).toBe(date);
    expect(listed.data.schedules[0].workLocationIds.sort()).toEqual([locA, locB].sort());
  });

  it('upsert replaces locations idempotently on (employee, date)', async () => {
    const admin = await setupSuperadmin();
    const employeeId = await setupEmployee();
    const shiftId = await createTestShift();
    shiftIds.push(shiftId);
    const locA = await createTestWorkLocation();
    const locB = await createTestWorkLocation();
    locationIds.push(locA, locB);
    const date = '2025-06-13';

    await upsertPOST(
      createMockRequest('POST', `${BASE}/api/attendance/schedules`, {
        token: admin.token,
        body: { employeeId, shiftId, date, workLocationIds: [locA] },
      }) as any,
    );
    await upsertPOST(
      createMockRequest('POST', `${BASE}/api/attendance/schedules`, {
        token: admin.token,
        body: { employeeId, shiftId, date, workLocationIds: [locB] },
      }) as any,
    );

    const rows = await db
      .select({ id: employeeSchedules.id })
      .from(employeeSchedules)
      .where(eq(employeeSchedules.employeeId, employeeId));
    expect(rows).toHaveLength(1);

    const listRes = await listGET(
      createMockRequest('GET', `${BASE}/api/attendance/schedules?from=${date}&to=${date}`, {
        token: admin.token,
      }) as any,
    );
    const listed = await listRes.json();
    const row = listed.data.schedules.find((s: any) => s.employeeId === employeeId);
    expect(row.workLocationIds).toEqual([locB]);
  });

  it('deactivates a schedule via DELETE', async () => {
    const admin = await setupSuperadmin();
    const employeeId = await setupEmployee();
    const shiftId = await createTestShift();
    shiftIds.push(shiftId);
    const loc = await createTestWorkLocation();
    locationIds.push(loc);
    const date = '2025-06-14';

    const createRes = await upsertPOST(
      createMockRequest('POST', `${BASE}/api/attendance/schedules`, {
        token: admin.token,
        body: { employeeId, shiftId, date, workLocationIds: [loc] },
      }) as any,
    );
    const created = await createRes.json();
    const scheduleId = created.data.id as string;

    const delRes = await scheduleDELETE(
      createMockRequest('DELETE', `${BASE}/api/attendance/schedules/${scheduleId}`, {
        token: admin.token,
      }) as any,
      ctx({ id: scheduleId }),
    );
    expect(delRes.status).toBe(200);

    const listRes = await listGET(
      createMockRequest('GET', `${BASE}/api/attendance/schedules?from=${date}&to=${date}`, {
        token: admin.token,
      }) as any,
    );
    const listed = await listRes.json();
    expect(listed.data.schedules.find((s: any) => s.id === scheduleId)).toBeUndefined();
  });

  it('manages default shift locations (GET/PUT round-trip)', async () => {
    const admin = await setupSuperadmin();
    const shiftId = await createTestShift();
    shiftIds.push(shiftId);
    const locA = await createTestWorkLocation();
    const locB = await createTestWorkLocation();
    locationIds.push(locA, locB);

    const emptyRes = await shiftLocGET(
      createMockRequest('GET', `${BASE}/api/attendance/shift-locations/${shiftId}`, {
        token: admin.token,
      }) as any,
      ctx({ shiftId }),
    );
    expect((await emptyRes.json()).data.workLocationIds).toEqual([]);

    const putRes = await shiftLocPUT(
      createMockRequest('PUT', `${BASE}/api/attendance/shift-locations/${shiftId}`, {
        token: admin.token,
        body: { workLocationIds: [locA, locB] },
      }) as any,
      ctx({ shiftId }),
    );
    expect(putRes.status).toBe(200);

    const afterRes = await shiftLocGET(
      createMockRequest('GET', `${BASE}/api/attendance/shift-locations/${shiftId}`, {
        token: admin.token,
      }) as any,
      ctx({ shiftId }),
    );
    expect((await afterRes.json()).data.workLocationIds.sort()).toEqual([locA, locB].sort());
  });
});
