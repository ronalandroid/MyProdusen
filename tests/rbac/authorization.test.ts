import { describe, it, expect, afterEach } from 'vitest';
import { GET as employeeGET } from '@/app/api/employees/[id]/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { createTestUser, createTestEmployee, createMockRequest, cleanupTestData } from '../helpers/test-utils';

describe('RBAC Authorization', () => {
  const testUserIds: string[] = [];
  const testEmployeeIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({
      employeeIds: testEmployeeIds,
      userIds: testUserIds,
    });
    testEmployeeIds.length = 0;
    testUserIds.length = 0;
  });

  it('should allow supervisor to see own team member', async () => {
    const supervisor = await createTestUser('SUPERVISOR');
    testUserIds.push(supervisor.id);
    const supervisorEmployeeId = await createTestEmployee(supervisor.id);
    testEmployeeIds.push(supervisorEmployeeId);

    const teamMember = await createTestUser('EMPLOYEE');
    testUserIds.push(teamMember.id);
    const teamMemberEmployeeId = await createTestEmployee(teamMember.id, {
      supervisorId: supervisorEmployeeId,
    });
    testEmployeeIds.push(teamMemberEmployeeId);

    const request = createMockRequest('GET', `http://localhost:3000/api/employees/${teamMemberEmployeeId}`, {
      token: supervisor.token,
    });

    const response = await employeeGET(request as any, { params: Promise.resolve({ id: teamMemberEmployeeId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(teamMemberEmployeeId);
  });

  it('should block supervisor from seeing other teams', async () => {
    const supervisor1 = await createTestUser('SUPERVISOR');
    testUserIds.push(supervisor1.id);
    const supervisor1EmployeeId = await createTestEmployee(supervisor1.id);
    testEmployeeIds.push(supervisor1EmployeeId);

    const supervisor2 = await createTestUser('SUPERVISOR');
    testUserIds.push(supervisor2.id);
    const supervisor2EmployeeId = await createTestEmployee(supervisor2.id);
    testEmployeeIds.push(supervisor2EmployeeId);

    const otherTeamMember = await createTestUser('EMPLOYEE');
    testUserIds.push(otherTeamMember.id);
    const otherTeamMemberEmployeeId = await createTestEmployee(otherTeamMember.id, {
      supervisorId: supervisor2EmployeeId,
    });
    testEmployeeIds.push(otherTeamMemberEmployeeId);

    const request = createMockRequest('GET', `http://localhost:3000/api/employees/${otherTeamMemberEmployeeId}`, {
      token: supervisor1.token,
    });

    const response = await employeeGET(request as any, { params: Promise.resolve({ id: otherTeamMemberEmployeeId }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should allow employee to see own data', async () => {
    const employee = await createTestUser('EMPLOYEE');
    testUserIds.push(employee.id);
    const employeeId = await createTestEmployee(employee.id);
    testEmployeeIds.push(employeeId);

    const request = createMockRequest('GET', `http://localhost:3000/api/employees/${employeeId}`, {
      token: employee.token,
    });

    const response = await employeeGET(request as any, { params: Promise.resolve({ id: employeeId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(employeeId);
  });

  it('should block employee from seeing another employee data', async () => {
    const employee1 = await createTestUser('EMPLOYEE');
    testUserIds.push(employee1.id);
    const employee1Id = await createTestEmployee(employee1.id);
    testEmployeeIds.push(employee1Id);

    const employee2 = await createTestUser('EMPLOYEE');
    testUserIds.push(employee2.id);
    const employee2Id = await createTestEmployee(employee2.id);
    testEmployeeIds.push(employee2Id);

    const request = createMockRequest('GET', `http://localhost:3000/api/employees/${employee2Id}`, {
      token: employee1.token,
    });

    const response = await employeeGET(request as any, { params: Promise.resolve({ id: employee2Id }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should prevent ADMIN_HR from creating SUPERADMIN', async () => {
    const adminHr = await createTestUser('ADMIN_HR');
    testUserIds.push(adminHr.id);

    const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
      token: adminHr.token,
      body: {
        email: `escalation_${Date.now()}@test.com`,
        username: `escalation_${Date.now()}`,
        password: 'Password123!',
        role: 'SUPERADMIN',
      },
    });

    const response = await registerPOST(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should prevent SUPERVISOR from creating users', async () => {
    const supervisor = await createTestUser('SUPERVISOR');
    testUserIds.push(supervisor.id);

    const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
      token: supervisor.token,
      body: {
        email: `supervisor_create_${Date.now()}@test.com`,
        username: `supervisor_create_${Date.now()}`,
        password: 'password123',
        role: 'EMPLOYEE',
      },
    });

    const response = await registerPOST(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});
