import { prisma } from '@/lib/db';
import { calculateDistance, isWithinGeofence, isGpsAccuracyAcceptable } from '@/lib/geofencing';
import { calculateLateMinutes, calculateEarlyLeaveMinutes, calculateMinutesDifference } from '@/lib/utils/date';
import { AttendanceStatus } from '@prisma/client';

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
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: {
        defaultShift: true,
        defaultLocation: true,
      },
    });

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

    const existingCheckIn = await prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingCheckIn) {
      throw new Error('Anda sudah melakukan check-in hari ini');
    }

    // Get work location
    const workLocation = await prisma.workLocation.findUnique({
      where: { id: data.workLocationId },
    });

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
      shift = await prisma.shift.findUnique({
        where: { id: shiftId },
      });
    }

    // Calculate late minutes
    const checkInTime = new Date();
    let lateMinutes = 0;
    let status: AttendanceStatus = AttendanceStatus.PRESENT;

    if (shift) {
      lateMinutes = calculateLateMinutes(checkInTime, shift.startTime);
      if (lateMinutes > 0) {
        status = AttendanceStatus.LATE;
      }
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
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
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
        workLocation: true,
        shift: true,
      },
    });

    return attendance;
  }

  async checkOut(data: {
    attendanceId: string;
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    selfie: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Get attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: data.attendanceId },
      include: {
        employee: true,
        workLocation: true,
        shift: true,
      },
    });

    if (!attendance) {
      throw new Error('Data absensi tidak ditemukan');
    }

    if (attendance.employeeId !== data.employeeId) {
      throw new Error('Anda tidak memiliki akses untuk check-out absensi ini');
    }

    if (attendance.checkOutTime) {
      throw new Error('Anda sudah melakukan check-out');
    }

    // Validate GPS accuracy
    if (!isGpsAccuracyAcceptable(data.accuracy)) {
      throw new Error('Akurasi GPS tidak memadai. Pastikan GPS aktif dan sinyal kuat.');
    }

    // Calculate distance from work location
    const distance = calculateDistance(
      data.latitude,
      data.longitude,
      attendance.workLocation.latitude,
      attendance.workLocation.longitude
    );

    // Validate geo-fencing
    const isWithinRadius = isWithinGeofence(
      data.latitude,
      data.longitude,
      attendance.workLocation.latitude,
      attendance.workLocation.longitude,
      attendance.workLocation.radius
    );

    if (!isWithinRadius) {
      throw new Error(
        `Anda berada di luar radius lokasi kerja (${Math.round(distance)}m dari lokasi). Radius maksimal: ${attendance.workLocation.radius}m`
      );
    }

    // Calculate work duration and early leave
    const checkOutTime = new Date();
    const totalWorkMinutes = calculateMinutesDifference(attendance.checkInTime, checkOutTime);
    
    let earlyLeaveMinutes = 0;
    if (attendance.shift) {
      earlyLeaveMinutes = calculateEarlyLeaveMinutes(checkOutTime, attendance.shift.endTime);
    }

    // Update attendance record
    const updated = await prisma.attendance.update({
      where: { id: data.attendanceId },
      data: {
        checkOutTime,
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude,
        checkOutAccuracy: data.accuracy,
        checkOutDistance: distance,
        checkOutSelfie: data.selfie,
        checkOutDeviceInfo: data.deviceInfo,
        checkOutIp: data.ipAddress,
        checkOutUserAgent: data.userAgent,
        totalWorkMinutes,
        earlyLeaveMinutes,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
        workLocation: true,
        shift: true,
      },
    });

    return updated;
  }

  async getTodayAttendance(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        workLocation: true,
        shift: true,
      },
    });

    return attendance;
  }

  async getAttendances(filters?: {
    employeeId?: string;
    supervisorId?: string;
    workLocationId?: string;
    status?: AttendanceStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters?.supervisorId) {
      where.employee = {
        supervisorId: filters.supervisorId,
      };
    }

    if (filters?.workLocationId) {
      where.workLocationId = filters.workLocationId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.checkInTime = {};
      if (filters.startDate) {
        where.checkInTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.checkInTime.lte = filters.endDate;
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
        workLocation: true,
        shift: true,
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    return attendances;
  }

  async manualAdjustment(data: {
    attendanceId: string;
    adjustedBy: string;
    reason: string;
    checkInTime?: Date;
    checkOutTime?: Date;
    status?: AttendanceStatus;
  }) {
    const attendance = await prisma.attendance.findUnique({
      where: { id: data.attendanceId },
      include: {
        shift: true,
      },
    });

    if (!attendance) {
      throw new Error('Data absensi tidak ditemukan');
    }

    const updateData: any = {
      isManualAdjustment: true,
      adjustmentReason: data.reason,
      adjustedBy: data.adjustedBy,
    };

    if (data.checkInTime) {
      updateData.checkInTime = data.checkInTime;
      
      // Recalculate late minutes
      if (attendance.shift) {
        updateData.lateMinutes = calculateLateMinutes(data.checkInTime, attendance.shift.startTime);
      }
    }

    if (data.checkOutTime) {
      updateData.checkOutTime = data.checkOutTime;
      
      // Recalculate work duration
      const checkInTime = data.checkInTime || attendance.checkInTime;
      updateData.totalWorkMinutes = calculateMinutesDifference(checkInTime, data.checkOutTime);
      
      // Recalculate early leave
      if (attendance.shift) {
        updateData.earlyLeaveMinutes = calculateEarlyLeaveMinutes(data.checkOutTime, attendance.shift.endTime);
      }
    }

    if (data.status) {
      updateData.status = data.status;
    }

    const updated = await prisma.attendance.update({
      where: { id: data.attendanceId },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
        workLocation: true,
        shift: true,
      },
    });

    return updated;
  }
}

export const attendanceService = new AttendanceService();
