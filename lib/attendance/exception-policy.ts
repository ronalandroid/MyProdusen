export type AttendanceExceptionType = 'OUTSIDE_GEOFENCE' | 'BAD_GPS_ACCURACY' | 'MISSING_SELFIE' | 'MANUAL_ADJUSTMENT' | 'LATE_CORRECTION' | 'MISSING_CHECKOUT';

export interface AttendanceExceptionPolicyInput {
  accuracy: number;
  distance: number;
  radius: number;
  selfiePresent: boolean;
  maxAccuracy?: number;
}

export interface AttendanceExceptionTrigger {
  type: AttendanceExceptionType;
  reason: string;
}

export function getAttendanceExceptionTrigger(input: AttendanceExceptionPolicyInput): AttendanceExceptionTrigger | null {
  const maxAccuracy = input.maxAccuracy ?? 100;

  if (input.accuracy > maxAccuracy) {
    return {
      type: 'BAD_GPS_ACCURACY',
      reason: `Akurasi GPS ${Math.round(input.accuracy)}m melebihi batas ${maxAccuracy}m`,
    };
  }

  if (!input.selfiePresent) {
    return {
      type: 'MISSING_SELFIE',
      reason: 'Selfie absensi belum tersedia',
    };
  }

  if (input.distance > input.radius) {
    return {
      type: 'OUTSIDE_GEOFENCE',
      reason: `Jarak ${Math.round(input.distance)}m di luar radius ${input.radius}m`,
    };
  }

  return null;
}

export function classifyAttendanceExceptionError(message: string): AttendanceExceptionTrigger | null {
  if (message.includes('Akurasi GPS')) {
    return { type: 'BAD_GPS_ACCURACY', reason: message };
  }

  if (message.includes('di luar radius')) {
    return { type: 'OUTSIDE_GEOFENCE', reason: message };
  }

  if (message.toLowerCase().includes('selfie')) {
    return { type: 'MISSING_SELFIE', reason: message };
  }

  return null;
}
