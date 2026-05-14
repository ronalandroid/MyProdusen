import { db, attendances, employees, workLocations, shifts } from '@/lib/db';
import { calculateDistance, isWithinGeofence, isGpsAccuracyAcceptable } from '@/lib/geofencing';
import { calculateLateMinutes, calculateEarlyLeaveMinutes, calculateMinutesDifference } from '@/lib/utils/date';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK' | 'PERMISSION';

export class AttendanceService {
  async checkIn(data: {
    employeeId: string;
    workLocationId: string;
    shiftId?: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    selfie: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Get employee data
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, data.employeeId))
      .limit(1);

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    if (employee.status !== 'ACTIVE') {
      throw new Error('Karyawan tidak aktif');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [existingCheckIn] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, data.employeeId),
          gte(attendances.checkInTime, today),
          lt(attendances.checkInTime, tomorrow)
        )
      )
      .limit(1);

    if (existingCheckIn) {
      throw new Error('Anda sudah melakukan check-in hari ini');
    }

    // Get work location
    const [workLocation] = await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.id, data.workLocationId))
      .limit(1);

    if (!workLocation) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    if (!workLocation.isActive) {
      throw new Error('Lokasi kerja tidak aktif');
    }

    // Validate GPS accuracy
    if (!isGpsAccuracyAcceptable(data.accuracy)) {
      throw new Error('Akurasi GPS tidak memadai. Pastikan GPS aktif dan sinyal kuat.');
    }

    // Calculate distance from work location
    const distance = calculateDistance(
      data.latitude,
      data.longitude,
      workLocation.latitude,
      workLocation.longitude
    );

    // Validate geo-fencing
    const isWithinRadius = isWithinGeofence(
      data.latitude,
      data.longitude,
      workLocation.latitude,
      workLocation.longitude,
      workLocation.radius
    );

    if (!isWithinRadius) {
      throw new Error(
        `Anda berada di luar radius lokasi kerja (${Math.round(distance)}m dari lokasi). Radius maksimal: ${workLocation.radius}m`
      );
    }

    // Get shift
    const shiftId = data.shiftId || employee.defaultShiftId;
    let shift = null;
    if (shiftId) {
      const [shiftData] = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, shiftId))
        .limit(1);
      shift = shiftData || null;
    }

    // Calculate late minutes
    const checkInTime = new Date();
    let lateMinutes = 0;
    let status: AttendanceStatus = 'PRESENT';

    if (shift) {
      lateMinutes = calculateLateMinutes(checkInTime, shift.startTime);
      if (lateMinutes > 0) {
        status = 'LATE';
      }
    }

    // Generate attendance ID
    const attendanceId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create attendance record
    const [attendance] = await db
      .insert(attendances)
      .values({
        id: attendanceId,
        employeeId: data.employeeId,
        workLocationId: data.workLocationId,
        shiftId: shiftId || null,
        checkInTime,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        checkInAccuracy: data.accuracy,
        checkInDistance: distance,
        checkInSelfie: data.selfie,
        checkInDeviceInfo: data.deviceInfo,
        checkInIp: data.ipAddress,
        checkInUserAgent: data.userAgent,
        status,
        lateMinutes,
      })
      .returning();

    return attendance;
  }

  async checkOut(data: {
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    selfie: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [attendance] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, data.employeeId),
          gte(attendances.checkInTime, today),
          lt(attendances.checkInTime, tomorrow)
        )
      )
      .limit(1);

    if (!attendance) {
      throw new Error('Anda belum melakukan check-in hari ini');
    }

    if (attendance.checkOutTime) {
      throw new Error('Anda sudah melakukan check-out hari ini');
    }

    // Get work location
    const [workLocation] = await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.id, attendance.workLocationId))
      .limit(1);

    if (!workLocation) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    // Validate GPS accuracy
    if (!isGpsAccuracyAcceptable(data.accuracy)) {
      throw new Error('Akurasi GPS tidak memadai. Pastikan GPS aktif dan sinyal kuat.');
    }

    // Calculate distance from work location
    const distance = calculateDistance(
      data.latitude,
      data.longitude,
      workLocation.latitude,
      workLocation.longitude
    );

    // Validate geo-fencing
    const isWithinRadius = isWithinGeofence(
      data.latitude,
      data.longitude,
      workLocation.latitude,
      workLocation.longitude,
      workLocation.radius
    );

    if (!isWithinRadius) {
      throw new Error(
        `Anda berada di luar radius lokasi kerja (${Math.round(distance)}m dari lokasi). Radius maksimal: ${workLocation.radius}m`
      );
    }

    const checkOutTime = new Date();

    // Calculate early leave minutes
    let earlyLeaveMinutes = 0;
    if (attendance.shiftId) {
      const [shift] = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, attendance.shiftId))
        .limit(1);

      if (shift) {
        earlyLeaveMinutes = calculateEarlyLeaveMinutes(checkOutTime, shift.endTime);
      }
    }

    // Calculate total work minutes
    const totalWorkMinutes = calculateMinutesDifference(
      attendance.checkInTime,
      checkOutTime
    );

    // Update attendance record
    const [updated] = await db
      .update(attendances)
      .set({
        checkOutTime,
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude,
        checkOutAccuracy: data.accuracy,
        checkOutDistance: distance,
        checkOutSelfie: data.selfie,
        checkOutDeviceInfo: data.deviceInfo,
        checkOutIp: data.ipAddress,
        checkOutUserAgent: data.userAgent,
        earlyLeaveMinutes,
        totalWorkMinutes,
        updatedAt: new Date(),
      })
      .where(eq(attendances.id, attendance.id))
      .returning();

    return updated;
  }

  async getTodayAttendance(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [attendance] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, employeeId),
          gte(attendances.checkInTime, today),
          lt(attendances.checkInTime, tomorrow)
        )
      )
      .limit(1);

    return attendance || null;
  }

  async getAttendances(filters?: {
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: AttendanceStatus;
  }) {
    const conditions = [];

    if (filters?.employeeId) {
      conditions.push(eq(attendances.employeeId, filters.employeeId));
    }

    if (filters?.startDate) {
      conditions.push(gte(attendances.checkInTime, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lt(attendances.checkInTime, filters.endDate));
    }

    if (filters?.status) {
      conditions.push(eq(attendances.status, filters.status));
    }

    let query = db
      .select()
      .from(attendances)
      .orderBy(desc(attendances.checkInTime));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }
}

export const attendanceService = new AttendanceService();
