import { describe, it, expect, afterEach } from 'vitest';
import { POST as checkInPOST } from '@/app/api/attendance/check-in/route';
import { POST as checkOutPOST } from '@/app/api/attendance/check-out/route';
import { GET as todayGET } from '@/app/api/attendance/today/route';
import { GET as attendanceGET } from '@/app/api/attendance/route';
import { createTestUser, createTestEmployee, createTestWorkLocation, createTestShift, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { db, attendances, employees } from '@/lib/db';
import { eq, and, gte, lt } from 'drizzle-orm';

describe('Attendance API', () => {
  const VALID_SELFIE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const testUserIds: string[] = [];
  const testEmployeeIds: string[] = [];
  const testLocationIds: string[] = [];
  const testShiftIds: string[] = [];
  const testAttendanceIds: string[] = [];

  async function assignAttendanceDefaults(employeeId: string, locationId: string, shiftId: string) {
    await db
      .update(employees)
      .set({ defaultLocationId: locationId, defaultShiftId: shiftId })
      .where(eq(employees.id, employeeId));
  }

  afterEach(async () => {
    // Clean up attendances first
    for (const id of testAttendanceIds) {
      await db.delete(attendances).where(eq(attendances.id, id));
    }
    testAttendanceIds.length = 0;

    await cleanupTestData({
      employeeIds: testEmployeeIds,
      userIds: testUserIds,
      locationIds: testLocationIds,
      shiftIds: testShiftIds,
    });
    testEmployeeIds.length = 0;
    testUserIds.length = 0;
    testLocationIds.length = 0;
    testShiftIds.length = 0;
  });

  describe('POST /api/attendance/check-in', () => {
    it('should check in successfully within geofence', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation({
        latitude: 3.5952,
        longitude: 98.6722,
        radius: 100,
      });
      testLocationIds.push(locationId);

      const shiftId = await createTestShift({
        startTime: '08:00',
        endTime: '17:00',
      });
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          shiftId: shiftId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
          deviceInfo: 'Test Device',
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.employeeId).toBe(employeeId);
      expect(data.data.checkInTime).toBeDefined();
      
      if (data.data.id) {
        testAttendanceIds.push(data.data.id);
      }
    });

    it('should reject check-in without realtime selfie', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation();
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Selfie realtime wajib diambil');
    });

    it('should reject invalid selfie type', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation();
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: new File(['not-image'], 'selfie.txt', { type: 'text/plain' }),
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Tipe file tidak valid');
    });

    it('should reject oversized selfie', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation();
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: new File([new Uint8Array(3 * 1024 * 1024)], 'selfie.jpg', { type: 'image/jpeg' }),
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Ukuran selfie terlalu besar');
    });

    it('should fail when outside geofence', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation({
        latitude: 3.5952,
        longitude: 98.6722,
        radius: 100,
      });
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.6000, // Far from location
          longitude: 98.7000,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('di luar radius');
    });

    it('should fail with poor GPS accuracy', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation();
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 150, // Poor accuracy
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Akurasi GPS');
    });

    it('should fail when already checked in today', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation({
        latitude: 3.5952,
        longitude: 98.6722,
        radius: 100,
      });
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      // First check-in
      const request1 = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response1 = await checkInPOST(request1 as any);
      const data1 = await response1.json();
      
      if (data1.data?.id) {
        testAttendanceIds.push(data1.data.id);
      }

      // Second check-in attempt
      const request2 = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response2 = await checkInPOST(request2 as any);
      const data2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(data2.success).toBe(false);
      expect(data2.message).toContain('sudah melakukan check-in');
    });

    it('should fail for inactive employee', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id, { status: 'INACTIVE' });
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation();
      testLocationIds.push(locationId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('tidak aktif');
    });

    it('should fail when employee has no default location or shift', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation();
      testLocationIds.push(locationId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Lokasi kerja default belum ditetapkan');
    });

    it('should fail when requested location or shift differs from employee defaults', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const assignedLocationId = await createTestWorkLocation();
      const requestedLocationId = await createTestWorkLocation();
      testLocationIds.push(assignedLocationId, requestedLocationId);

      const assignedShiftId = await createTestShift();
      const requestedShiftId = await createTestShift();
      testShiftIds.push(assignedShiftId, requestedShiftId);

      const employeeId = await createTestEmployee(user.id, {
        defaultLocationId: assignedLocationId,
        defaultShiftId: assignedShiftId,
      });
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: requestedLocationId,
          shiftId: requestedShiftId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response = await checkInPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Lokasi kerja tidak sesuai');
    });
  });

  describe('POST /api/attendance/check-out', () => {
    it('should check out successfully after check-in', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation({
        latitude: 3.5952,
        longitude: 98.6722,
        radius: 100,
      });
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      // Check in first
      const checkInRequest = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const checkInResponse = await checkInPOST(checkInRequest as any);
      const checkInData = await checkInResponse.json();
      
      if (checkInData.data?.id) {
        testAttendanceIds.push(checkInData.data.id);
      }

      // Check out
      const checkOutRequest = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-out', {
        token: user.token,
        body: {
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const checkOutResponse = await checkOutPOST(checkOutRequest as any);
      const checkOutData = await checkOutResponse.json();

      expect(checkOutResponse.status).toBe(200);
      expect(checkOutData.success).toBe(true);
      expect(checkOutData.data.checkOutTime).toBeDefined();
    });

    it('should fail when not checked in', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-out', {
        token: user.token,
        body: {
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const response = await checkOutPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('belum melakukan check-in');
    });
  });

  describe('GET /api/attendance/today', () => {
    it('should get today attendance', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const locationId = await createTestWorkLocation({
        latitude: 3.5952,
        longitude: 98.6722,
        radius: 100,
      });
      testLocationIds.push(locationId);
      const shiftId = await createTestShift();
      testShiftIds.push(shiftId);
      await assignAttendanceDefaults(employeeId, locationId, shiftId);

      // Check in
      const checkInRequest = createMockRequest('POST', 'http://localhost:3000/api/attendance/check-in', {
        token: user.token,
        body: {
          workLocationId: locationId,
          latitude: 3.5952,
          longitude: 98.6722,
          accuracy: 10,
          selfie: VALID_SELFIE_DATA_URL,
        },
      });

      const checkInResponse = await checkInPOST(checkInRequest as any);
      const checkInData = await checkInResponse.json();
      
      if (checkInData.data?.id) {
        testAttendanceIds.push(checkInData.data.id);
      }

      // Get today
      const request = createMockRequest('GET', 'http://localhost:3000/api/attendance/today', {
        token: user.token,
      });

      const response = await todayGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.employeeId).toBe(employeeId);
    });

    it('should return null when no attendance today', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const employeeId = await createTestEmployee(user.id);
      testEmployeeIds.push(employeeId);

      const request = createMockRequest('GET', 'http://localhost:3000/api/attendance/today', {
        token: user.token,
      });

      const response = await todayGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeNull();
    });
  });
});
