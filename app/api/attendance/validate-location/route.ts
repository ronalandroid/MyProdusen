import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { scheduleService } from '@/services/attendance/schedule.service';
import { isGpsAccuracyAcceptable, getMaxGpsAccuracyMeters } from '@/lib/geofencing';
import { errorResponse, successResponse, unauthorizedResponse } from '@/utils/response';

/**
 * POST /api/attendance/validate-location
 * Server-side geofence validation for Clock In/Out step 1.
 * Validates against ALL valid locations for the employee's resolved schedule.
 * Never trusts client-side validation alone.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'EMPLOYEE' && user.role !== 'LEADER') {
      // Self attendance validation is for staff roles
      return errorResponse('Validasi lokasi hanya untuk karyawan', 403);
    }

    const body = (await request.json().catch(() => ({}))) as {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      type?: string;
    };

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const accuracy = Number(body.accuracy);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return errorResponse('Koordinat GPS tidak valid', 400);
    }

    const employee = await employeeService.getEmployeeByUserId(user.userId);
    const schedule = await scheduleService.getScheduleForDate(employee.id);

    if (schedule.source === 'none' || !schedule.shift) {
      return successResponse({
        valid: false,
        reason: 'NO_SCHEDULE',
        message: 'Tidak ada jadwal shift untuk hari ini. Hubungi Admin HR.',
        schedule,
        nearestLocation: null,
      });
    }

    if (schedule.locations.length === 0) {
      return successResponse({
        valid: false,
        reason: 'NO_LOCATION',
        message: 'Belum ada lokasi kerja untuk jadwal Anda. Hubungi Admin HR.',
        schedule,
        nearestLocation: null,
      });
    }

    const maxAccuracy = getMaxGpsAccuracyMeters();
    const accuracyOk = Number.isFinite(accuracy) ? isGpsAccuracyAcceptable(accuracy) : true;

    const result = scheduleService.validateAgainstLocations(latitude, longitude, schedule.locations);
    const nearest = result.nearest;

    if (!accuracyOk) {
      return successResponse({
        valid: false,
        reason: 'BAD_ACCURACY',
        message: `Akurasi GPS belum cukup baik (maks ${maxAccuracy} m). Coba pindah ke area terbuka lalu refresh.`,
        schedule,
        nearestLocation: nearest
          ? {
              id: nearest.id,
              name: nearest.name,
              distanceMeters: Math.round(nearest.distanceMeters),
              radiusMeters: nearest.radiusMeters,
            }
          : null,
      });
    }

    return successResponse({
      valid: result.valid,
      reason: result.valid ? 'OK' : 'OUTSIDE_RADIUS',
      message: result.valid
        ? 'Anda berada di lokasi yang valid'
        : `Anda berada di luar area absensi. Jarak Anda ${Math.round(nearest?.distanceMeters || 0)} meter dari ${nearest?.name || 'lokasi kerja'}.`,
      schedule,
      nearestLocation: nearest
        ? {
            id: nearest.id,
            name: nearest.name,
            distanceMeters: Math.round(nearest.distanceMeters),
            radiusMeters: nearest.radiusMeters,
          }
        : null,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal memvalidasi lokasi');
  }
}
