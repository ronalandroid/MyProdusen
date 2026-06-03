import { describe, it, expect } from 'vitest';
import {
  buildAttendanceFormData,
  dataUrlToFile,
} from '@/hooks/offline/sync-manager';
import { checkInSchema, checkOutSchema } from '@/utils/validation/attendance';

/**
 * These tests pin the REBUILT offline attendance sync payload shape to the
 * server contract enforced by parseCheckInRealtimeForm / checkInSchema:
 *   - multipart/form-data (FormData), never JSON
 *   - a non-empty `selfie` File
 *   - flat fields with server names: workLocationId, latitude, longitude,
 *     accuracy, gpsTimestamp (string), shiftId, deviceInfo
 *
 * The old payload used JSON with the wrong keys (locationId, selfieDataUrl,
 * numeric timestamp) and could therefore NEVER sync.
 */

const SELFIE_DATA_URL =
  'data:image/jpeg;base64,' + Buffer.from('fake-jpeg-bytes').toString('base64');

// Shape stored in the sync queue by OfflineAttendanceService.checkIn()
const checkInQueueData = {
  type: 'check-in' as const,
  employeeId: 'emp-1',
  latitude: 3.5952,
  longitude: 98.6722,
  accuracy: 12.5,
  selfieDataUrl: SELFIE_DATA_URL,
  locationId: 'loc-123',
  shiftId: 'shift-9',
  notes: 'Android/Chrome',
  timestamp: 1717999999000,
};

const checkOutQueueData = {
  type: 'check-out' as const,
  employeeId: 'emp-1',
  latitude: 3.5952,
  longitude: 98.6722,
  accuracy: 8,
  selfieDataUrl: SELFIE_DATA_URL,
  notes: 'Android/Chrome',
  timestamp: 1718003599000,
};

function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

describe('dataUrlToFile', () => {
  it('converts a base64 data URL into a non-empty File with correct mime', () => {
    const file = dataUrlToFile(SELFIE_DATA_URL, 'selfie.jpg');
    expect(file).toBeInstanceOf(File);
    expect(file!.name).toBe('selfie.jpg');
    expect(file!.type).toBe('image/jpeg');
    expect(file!.size).toBeGreaterThan(0);
  });

  it('returns null for non data-URL strings', () => {
    expect(dataUrlToFile('not-a-data-url', 'x.jpg')).toBeNull();
    expect(dataUrlToFile('', 'x.jpg')).toBeNull();
  });
});

describe('buildAttendanceFormData (check-in)', () => {
  const form = buildAttendanceFormData(checkInQueueData);

  it('produces a FormData (multipart), not JSON', () => {
    expect(form).toBeInstanceOf(FormData);
  });

  it('includes a non-empty selfie File under the `selfie` key', () => {
    const selfie = form.get('selfie');
    expect(selfie).toBeInstanceOf(File);
    expect((selfie as File).size).toBeGreaterThan(0);
  });

  it('remaps locationId -> workLocationId and timestamp -> ISO gpsTimestamp', () => {
    const fields = formToObject(form);
    expect(fields.workLocationId).toBe('loc-123');
    // old (broken) key must NOT be present
    expect(fields.locationId).toBeUndefined();
    expect(fields.gpsTimestamp).toBe(
      new Date(checkInQueueData.timestamp).toISOString()
    );
    expect(fields.shiftId).toBe('shift-9');
    expect(fields.deviceInfo).toBe('Android/Chrome');
    expect(fields.latitude).toBe('3.5952');
    expect(fields.longitude).toBe('98.6722');
    expect(fields.accuracy).toBe('12.5');
  });

  it('passes the server checkInSchema (the gate that previously rejected it)', () => {
    const fields = formToObject(form);
    const parsed = checkInSchema.safeParse({
      workLocationId: fields.workLocationId,
      shiftId: fields.shiftId,
      latitude: Number(fields.latitude),
      longitude: Number(fields.longitude),
      accuracy: Number(fields.accuracy),
      deviceInfo: fields.deviceInfo,
      gpsTimestamp: fields.gpsTimestamp,
    });
    expect(parsed.success).toBe(true);
  });
});

describe('buildAttendanceFormData (check-out)', () => {
  const form = buildAttendanceFormData(checkOutQueueData);

  it('includes a non-empty selfie File and passes checkOutSchema', () => {
    expect(form.get('selfie')).toBeInstanceOf(File);
    const fields = formToObject(form);
    const parsed = checkOutSchema.safeParse({
      latitude: Number(fields.latitude),
      longitude: Number(fields.longitude),
      accuracy: Number(fields.accuracy),
      deviceInfo: fields.deviceInfo,
      gpsTimestamp: fields.gpsTimestamp,
    });
    expect(parsed.success).toBe(true);
  });
});
