import { describe, it, expect, afterEach } from 'vitest';
import { GET as employeesGET, POST as employeesPOST } from '@/app/api/employees/route';
import { DELETE as employeeDELETE, GET as employeeGET } from '@/app/api/employees/[id]/route';
import { createTestUser, createTestEmployee, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('Employees API', () => {
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

  describe('GET /api/employees', () => {
    it('should get employees as SUPERADMIN', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);

      const request = createMockRequest('GET', 'http://localhost:3000/api/employees', {
        token: superadmin.token,
      });

      const response = await employeesGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/employees');

      const response = await employeesGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should fail as EMPLOYEE without permission', async () => {
      const employee = await createTestUser('EMPLOYEE');
      testUserIds.push(employee.id);

      const request = createMockRequest('GET', 'http://localhost:3000/api/employees', {
        token: employee.token,
      });

      const response = await employeesGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should deny historical supervisor employee list access', async () => {
      const supervisor1 = await createTestUser('SUPERVISOR');
      testUserIds.push(supervisor1.id);
      const supervisor1EmpId = await createTestEmployee(supervisor1.id);
      testEmployeeIds.push(supervisor1EmpId);

      const supervisor2 = await createTestUser('SUPERVISOR');
      testUserIds.push(supervisor2.id);
      const supervisor2EmpId = await createTestEmployee(supervisor2.id);
      testEmployeeIds.push(supervisor2EmpId);

      const teamEmployee = await createTestUser('EMPLOYEE');
      testUserIds.push(teamEmployee.id);
      const teamEmployeeId = await createTestEmployee(teamEmployee.id, {
        supervisorId: supervisor1EmpId,
      });
      testEmployeeIds.push(teamEmployeeId);

      const otherEmployee = await createTestUser('EMPLOYEE');
      testUserIds.push(otherEmployee.id);
      const otherEmployeeId = await createTestEmployee(otherEmployee.id, {
        supervisorId: supervisor2EmpId,
      });
      testEmployeeIds.push(otherEmployeeId);

      const request = createMockRequest('GET', `http://localhost:3000/api/employees?supervisorId=${supervisor2EmpId}`, {
        token: supervisor1.token,
      });

      const response = await employeesGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/employees', () => {
    it('should create employee as SUPERADMIN', async () => {
      const adminHr = await createTestUser('SUPERADMIN');
      testUserIds.push(adminHr.id);
      const unique = Date.now().toString(36);

      const request = createMockRequest('POST', 'http://localhost:3000/api/employees', {
        token: adminHr.token,
        body: {
          email: `newemployee-${unique}@test.com`,
          username: `newemployee${unique}`,
          password: 'Password123!',
          fullName: 'New Employee',
          phone: '081234567890',
          division: 'IT',
          position: 'Developer',
        },
      });

      const response = await employeesPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.fullName).toBe('New Employee');
      expect(data.data.nip).toBeDefined();

      if (data.data.id) {
        testEmployeeIds.push(data.data.id);
      }
      if (data.data.userId) {
        testUserIds.push(data.data.userId);
      }
    });

    it('should create employee account with selected production access role and placement', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);
      const unique = Date.now().toString(36);

      const request = createMockRequest('POST', 'http://localhost:3000/api/employees', {
        token: superadmin.token,
        body: {
          email: `operator-expedition-${unique}@test.com`,
          username: `operatorexpedition${unique}`,
          password: 'Password123!',
          fullName: 'Operator Expedition',
          phone: '081234567891',
          division: 'Expedition',
          position: 'Operator',
          role: 'EMPLOYEE',
        },
      });

      const response = await employeesPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.division).toBe('Expedition');
      expect(data.data.position).toBe('Operator');

      const [createdUser] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, data.data.userId))
        .limit(1);

      expect(createdUser.role).toBe('EMPLOYEE');

      if (data.data.id) {
        testEmployeeIds.push(data.data.id);
      }
      if (data.data.userId) {
        testUserIds.push(data.data.userId);
      }
    });

    it('should reject employee creation when actor cannot assign selected role', async () => {
      const adminHr = await createTestUser('ADMIN_HR');
      testUserIds.push(adminHr.id);
      const unique = Date.now().toString(36);

      const request = createMockRequest('POST', 'http://localhost:3000/api/employees', {
        token: adminHr.token,
        body: {
          email: `blocked-superadmin-${unique}@test.com`,
          username: `blockedsuperadmin${unique}`,
          password: 'password123',
          fullName: 'Blocked Superadmin',
          division: 'HR',
          position: 'Admin',
          role: 'SUPERADMIN',
        },
      });

      const response = await employeesPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should fail without permission', async () => {
      const employee = await createTestUser('EMPLOYEE');
      testUserIds.push(employee.id);

      const request = createMockRequest('POST', 'http://localhost:3000/api/employees', {
        token: employee.token,
        body: {
          email: 'newemployee@test.com',
          username: 'newemployee',
          password: 'password123',
          fullName: 'New Employee',
        },
      });

      const response = await employeesPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      const adminHr = await createTestUser('SUPERADMIN');
      testUserIds.push(adminHr.id);

      const existingUser = await createTestUser('EMPLOYEE', {
        email: 'existing@test.com',
      });
      testUserIds.push(existingUser.id);

      const request = createMockRequest('POST', 'http://localhost:3000/api/employees', {
        token: adminHr.token,
        body: {
          email: 'existing@test.com',
          username: 'newusername',
          password: 'password123',
          fullName: 'New Employee',
        },
      });

      const response = await employeesPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Email sudah terdaftar');
    });
  });

  describe('GET /api/employees/[id]', () => {
    it('should get own employee data', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('GET', `http://localhost:3000/api/employees/${employeeId}`, {
        token: user.token,
      });

      const response = await employeeGET(request as any, { params: Promise.resolve({ id: employeeId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(employeeId);
    });

    it('should fail to get other employee data as EMPLOYEE', async () => {
      const user1 = await createTestUser('EMPLOYEE');
      testUserIds.push(user1.id);
      const employeeId1 = await createTestEmployee(user1.id);
      testEmployeeIds.push(employeeId1);

      const user2 = await createTestUser('EMPLOYEE');
      testUserIds.push(user2.id);
      const employeeId2 = await createTestEmployee(user2.id);
      testEmployeeIds.push(employeeId2);

      const request = createMockRequest('GET', `http://localhost:3000/api/employees/${employeeId2}`, {
        token: user1.token,
      });

      const response = await employeeGET(request as any, { params: Promise.resolve({ id: employeeId2 }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should get any employee data as SUPERADMIN', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);

      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);
      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('GET', `http://localhost:3000/api/employees/${employeeId}`, {
        token: superadmin.token,
      });

      const response = await employeeGET(request as any, { params: Promise.resolve({ id: employeeId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(employeeId);
    });
  });

  describe('DELETE /api/employees/[id]', () => {
    it('should delete employee as SUPERADMIN', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);

      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);
      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('DELETE', `http://localhost:3000/api/employees/${employeeId}`, {
        token: superadmin.token,
      });

      const response = await employeeDELETE(request as any, { params: Promise.resolve({ id: employeeId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject employee delete without EMPLOYEE_DELETE permission', async () => {
      const adminHr = await createTestUser('ADMIN_HR');
      testUserIds.push(adminHr.id);

      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);
      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('DELETE', `http://localhost:3000/api/employees/${employeeId}`, {
        token: adminHr.token,
      });

      const response = await employeeDELETE(request as any, { params: Promise.resolve({ id: employeeId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });
});
