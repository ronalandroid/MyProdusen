import { afterEach, describe, expect, it } from 'vitest';
import { GET as dashboardGET } from '@/app/api/dashboard/stats/route';
import { db, attendances, kpiResults, leaveRequests, users } from '@/lib/db';
import { createMockRequest, createTestEmployee, createTestUser, cleanupTestData } from '../helpers/test-utils';
import { eq, inArray } from 'drizzle-orm';

describe('Dashboard stats API', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const attendanceIds: string[] = [];
  const leaveIds: string[] = [];
  const kpiIds: string[] = [];

  afterEach(async () => {
    if (kpiIds.length) await db.delete(kpiResults).where(inArray(kpiResults.id, kpiIds));
    if (leaveIds.length) await db.delete(leaveRequests).where(inArray(leaveRequests.id, leaveIds));
    if (attendanceIds.length) await db.delete(attendances).where(inArray(attendances.id, attendanceIds));
    await cleanupTestData({ employeeIds, userIds });
    userIds.length = 0;
    employeeIds.length = 0;
    attendanceIds.length = 0;
    leaveIds.length = 0;
    kpiIds.length = 0;
  });

  it('returns superadmin monitoring insights with trend, division chart, KPI, risks, and management cards', async () => {
    const superadmin = await createTestUser('SUPERADMIN');
    userIds.push(superadmin.id);

    const productionUser = await createTestUser('EMPLOYEE');
    const packingUser = await createTestUser('EMPLOYEE');
    userIds.push(productionUser.id, packingUser.id);

    const productionEmployeeId = await createTestEmployee(productionUser.id);
    const packingEmployeeId = await createTestEmployee(packingUser.id);
    employeeIds.push(productionEmployeeId, packingEmployeeId);

    await db.update(users).set({ role: 'SUPERVISOR' }).where(eq(users.id, productionUser.id));

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const currentMonth = now.toISOString().slice(0, 7);

    const insertedAttendance = await db.insert(attendances).values([
      {
        id: `dash_att_${Date.now()}_1`,
        employeeId: productionEmployeeId,
        workLocationId: 'test-dashboard-location',
        checkInTime: now,
        checkInLatitude: 3.5952,
        checkInLongitude: 98.6722,
        checkInSelfie: 'selfie-a',
        status: 'PRESENT',
      },
      {
        id: `dash_att_${Date.now()}_2`,
        employeeId: packingEmployeeId,
        workLocationId: 'test-dashboard-location',
        checkInTime: yesterday,
        checkInLatitude: 3.5952,
        checkInLongitude: 98.6722,
        checkInSelfie: 'selfie-b',
        status: 'LATE',
      },
    ]).returning({ id: attendances.id });
    attendanceIds.push(...insertedAttendance.map((row) => row.id));

    const insertedLeave = await db.insert(leaveRequests).values({
      id: `dash_leave_${Date.now()}`,
      employeeId: productionEmployeeId,
      type: 'LEAVE',
      startDate: now,
      endDate: now,
      reason: 'Need approval',
      status: 'PENDING',
    }).returning({ id: leaveRequests.id });
    leaveIds.push(insertedLeave[0].id);

    const insertedKpi = await db.insert(kpiResults).values([
      {
        id: `dash_kpi_${Date.now()}_1`,
        employeeId: productionEmployeeId,
        itemId: `dash_item_${Date.now()}_1`,
        period: currentMonth,
        actualValue: 95,
        score: 95,
        isApproved: true,
      },
      {
        id: `dash_kpi_${Date.now()}_2`,
        employeeId: packingEmployeeId,
        itemId: `dash_item_${Date.now()}_2`,
        period: currentMonth,
        actualValue: 60,
        score: 60,
        isApproved: false,
      },
    ]).returning({ id: kpiResults.id });
    kpiIds.push(...insertedKpi.map((row) => row.id));

    const request = createMockRequest('GET', 'http://localhost:3000/api/dashboard/stats', {
      token: superadmin.token,
    });

    const response = await dashboardGET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.role).toBe('SUPERADMIN');
    expect(data.data.superadminInsights).toBeDefined();
    expect(data.data.superadminInsights.attendanceTrend).toHaveLength(7);
    expect(data.data.superadminInsights.divisionMonitoring.length).toBeGreaterThan(0);
    expect(data.data.superadminInsights.kpiOverview.averageScore).toBeGreaterThanOrEqual(0);
    expect(data.data.superadminInsights.employeeRisks.length).toBeGreaterThan(0);
    expect(data.data.superadminInsights.managementCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Total Karyawan', href: '/dashboard/employees' }),
        expect.objectContaining({ label: 'Pengajuan Pending', href: '/dashboard/attendance/exceptions' }),
      ]),
    );
  });
});
