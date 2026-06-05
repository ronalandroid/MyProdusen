import { z } from 'zod';
import { AppError } from '@/lib/core/app-error';
import { checkInSchema, checkOutSchema } from '@/utils/validation/attendance';

type AttendanceFormParseResult<T> = {
  data: T;
  selfie: File;
};

const MISSING_SELFIE_MESSAGE = 'Selfie realtime wajib diambil untuk melanjutkan absensi.';
const INVALID_FORM_MESSAGE = 'Payload absensi harus menggunakan FormData realtime selfie.';

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value === undefined ? undefined : Number(value);
}

function readBoolean(formData: FormData, key: string) {
  const value = readString(formData, key);
  if (value === undefined) return undefined;
  return value === 'true' || value === '1';
}

function requireSelfieFile(formData: FormData) {
  const selfie = formData.get('selfie');

  if (!(selfie instanceof File) || selfie.size === 0) {
    throw AppError.validation(MISSING_SELFIE_MESSAGE);
  }

  return selfie;
}

export async function parseCheckInRealtimeForm(request: Request): Promise<AttendanceFormParseResult<z.infer<typeof checkInSchema>>> {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    throw AppError.validation(INVALID_FORM_MESSAGE);
  }

  const selfie = requireSelfieFile(formData);
  const validation = checkInSchema.safeParse({
    workLocationId: readString(formData, 'workLocationId'),
    shiftId: readString(formData, 'shiftId'),
    latitude: readNumber(formData, 'latitude'),
    longitude: readNumber(formData, 'longitude'),
    accuracy: readNumber(formData, 'accuracy'),
    livenessScore: readNumber(formData, 'livenessScore'),
    livenessPassed: readBoolean(formData, 'livenessPassed'),
    deviceInfo: readString(formData, 'deviceInfo'),
    gpsTimestamp: readString(formData, 'gpsTimestamp'),
    note: readString(formData, 'note'),
  });

  if (!validation.success) {
    throw AppError.validation(validation.error.errors[0]?.message || 'Payload absensi tidak valid');
  }

  return { data: validation.data, selfie };
}

export async function parseCheckOutRealtimeForm(request: Request): Promise<AttendanceFormParseResult<z.infer<typeof checkOutSchema>>> {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    throw AppError.validation(INVALID_FORM_MESSAGE);
  }

  const selfie = requireSelfieFile(formData);
  const validation = checkOutSchema.safeParse({
    attendanceId: readString(formData, 'attendanceId'),
    latitude: readNumber(formData, 'latitude'),
    longitude: readNumber(formData, 'longitude'),
    accuracy: readNumber(formData, 'accuracy'),
    livenessScore: readNumber(formData, 'livenessScore'),
    livenessPassed: readBoolean(formData, 'livenessPassed'),
    deviceInfo: readString(formData, 'deviceInfo'),
    gpsTimestamp: readString(formData, 'gpsTimestamp'),
    note: readString(formData, 'note'),
  });

  if (!validation.success) {
    throw AppError.validation(validation.error.errors[0]?.message || 'Payload absensi tidak valid');
  }

  return { data: validation.data, selfie };
}
