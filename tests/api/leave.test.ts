import { describe, it, expect, afterEach } from 'vitest';
import { GET as leaveGET, POST as leavePOST } from '@/app/api/leave/route';
import { DELETE as leaveDELETE } from '@/app/api/leave/[id]/route';
import { POST as approveLeave } from '@/app/api/leave/[id]/approve/route';
import { POST as rejectLeave } from '@/app/api/leave/[id]/reject/route';
import { createTestUser, createTestEmployee, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { db, leaveRequests } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('Leave API', () => {
  const testUserIds: string[] = [];
  const testEmployeeIds: string[] = [];
  const testLeaveIds: string[] = [];

  afterEach(async () => {
    // Clean up leave requests first
    for (const id of testLeaveIds) {
      await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    }
    testLeaveIds.length = 0;

    await cleanupTestData({
      employeeIds: testEmployeeIds,
      userIds: testUserIds,
    });
    testEmployeeIds.length = 0;
    testUserIds.length = 0;
  });

  describe('POST /api/leave', () => {
    it('should create leave request successfully', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const request = createMockRequest('POST', 'http://localhost:3000/api/leave', {
        token: user.token,
        body: {
          type: 'LEAVE',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Family vacation',
        },
      });

      const response = await leavePOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('LEAVE');
      expect(data.data.status).toBe('PENDING');

      if (data.data.id) {
        testLeaveIds.push(data.data.id);
      }
    });

    it('should fail without authentication', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/leave', {
        body: {
          type: 'LEAVE',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          reason: 'Test',
        },
      });

      const response = await leavePOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/leave', () => {
    it('should get own leave requests as EMPLOYEE', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('GET', 'http://localhost:3000/api/leave', {
        token: user.token,
      });

      const response = await leaveGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get all leave requests as SUPERADMIN', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);

      const request = createMockRequest('GET', 'http://localhost:3000/api/leave', {
        token: superadmin.token,
      });

      const response = await leaveGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should only list supervisor own team leave requests', async () => {
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

      const teamLeaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: teamLeaveId,
        employeeId: teamEmployeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Team leave request',
        status: 'PENDING',
      });
      testLeaveIds.push(teamLeaveId);

      const otherLeaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: otherLeaveId,
        employeeId: otherEmployeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Other team leave request',
        status: 'PENDING',
      });
      testLeaveIds.push(otherLeaveId);

      const request = createMockRequest('GET', 'http://localhost:3000/api/leave', {
        token: supervisor1.token,
      });

      const response = await leaveGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.map((leave: any) => leave.id)).toContain(teamLeaveId);
      expect(data.data.map((leave: any) => leave.id)).not.toContain(otherLeaveId);
    });
  });

  describe('POST /api/leave/[id]/approve', () => {
    it('should approve leave request as supervisor', async () => {
      const supervisor = await createTestUser('SUPERVISOR');
      testUserIds.push(supervisor.id);
      const supervisorEmpId = await createTestEmployee(supervisor.id);
      testEmployeeIds.push(supervisorEmpId);

      const employee = await createTestUser('EMPLOYEE');
      testUserIds.push(employee.id);
      const employeeId = await createTestEmployee(employee.id, {
        supervisorId: supervisorEmpId,
      });
      testEmployeeIds.push(employeeId);

      // Create leave request
      const leaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: leaveId,
        employeeId: employeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Test leave',
        status: 'PENDING',
      });
      testLeaveIds.push(leaveId);

      const request = createMockRequest('POST', `http://localhost:3000/api/leave/${leaveId}/approve`, {
        token: supervisor.token,
      });

      const response = await approveLeave(request as any, { params: Promise.resolve({ id: leaveId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('APPROVED');
    });

    it('should fail to approve leave from other team', async () => {
      const supervisor1 = await createTestUser('SUPERVISOR');
      testUserIds.push(supervisor1.id);
      const supervisor1EmpId = await createTestEmployee(supervisor1.id);
      testEmployeeIds.push(supervisor1EmpId);

      const supervisor2 = await createTestUser('SUPERVISOR');
      testUserIds.push(supervisor2.id);
      const supervisor2EmpId = await createTestEmployee(supervisor2.id);
      testEmployeeIds.push(supervisor2EmpId);

      const employee = await createTestUser('EMPLOYEE');
      testUserIds.push(employee.id);
      const employeeId = await createTestEmployee(employee.id, {
        supervisorId: supervisor1EmpId,
      });
      testEmployeeIds.push(employeeId);

      // Create leave request
      const leaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: leaveId,
        employeeId: employeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Test leave',
        status: 'PENDING',
      });
      testLeaveIds.push(leaveId);

      const request = createMockRequest('POST', `http://localhost:3000/api/leave/${leaveId}/approve`, {
        token: supervisor2.token,
      });

      const response = await approveLeave(request as any, { params: Promise.resolve({ id: leaveId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should approve any leave as SUPERADMIN', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);

      const employee = await createTestUser('EMPLOYEE');
      testUserIds.push(employee.id);
      const employeeId = await createTestEmployee(employee.id);
      testEmployeeIds.push(employeeId);

      // Create leave request
      const leaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: leaveId,
        employeeId: employeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Test leave',
        status: 'PENDING',
      });
      testLeaveIds.push(leaveId);

      const request = createMockRequest('POST', `http://localhost:3000/api/leave/${leaveId}/approve`, {
        token: superadmin.token,
      });

      const response = await approveLeave(request as any, { params: Promise.resolve({ id: leaveId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('APPROVED');
    });
  });

  describe('POST /api/leave/[id]/reject', () => {
    it('should reject leave request as supervisor', async () => {
      const supervisor = await createTestUser('SUPERVISOR');
      testUserIds.push(supervisor.id);
      const supervisorEmpId = await createTestEmployee(supervisor.id);
      testEmployeeIds.push(supervisorEmpId);

      const employee = await createTestUser('EMPLOYEE');
      testUserIds.push(employee.id);
      const employeeId = await createTestEmployee(employee.id, {
        supervisorId: supervisorEmpId,
      });
      testEmployeeIds.push(employeeId);

      // Create leave request
      const leaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: leaveId,
        employeeId: employeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Test leave',
        status: 'PENDING',
      });
      testLeaveIds.push(leaveId);

      const request = createMockRequest('POST', `http://localhost:3000/api/leave/${leaveId}/reject`, {
        token: supervisor.token,
        body: {
          reason: 'Not enough staff coverage',
        },
      });

      const response = await rejectLeave(request as any, { params: Promise.resolve({ id: leaveId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('REJECTED');
    });
  });

  describe('DELETE /api/leave/[id]', () => {
    it('should delete own pending leave request', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);
      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const leaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: leaveId,
        employeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Own pending leave',
        status: 'PENDING',
      });
      testLeaveIds.push(leaveId);

      const request = createMockRequest('DELETE', `http://localhost:3000/api/leave/${leaveId}`, {
        token: user.token,
      });

      const response = await leaveDELETE(request as any, { params: Promise.resolve({ id: leaveId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject deleting another employee leave request', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);
      const userEmployeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(userEmployeeId);

      const otherUser = await createTestUser('EMPLOYEE');
      testUserIds.push(otherUser.id);
      const otherEmployeeId = await createTestEmployee(otherUser.id);
      testEmployeeIds.push(otherEmployeeId);

      const leaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(leaveRequests).values({
        id: leaveId,
        employeeId: otherEmployeeId,
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Other pending leave',
        status: 'PENDING',
      });
      testLeaveIds.push(leaveId);

      const request = createMockRequest('DELETE', `http://localhost:3000/api/leave/${leaveId}`, {
        token: user.token,
      });

      const response = await leaveDELETE(request as any, { params: Promise.resolve({ id: leaveId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });
});
