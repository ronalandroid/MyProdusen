import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdir, rm, stat } from 'fs/promises';
import path from 'path';
import os from 'os';

const TEST_UPLOAD_DIR = path.join(os.tmpdir(), 'myprodusen-selfie-tests');
const ORIGINAL_UPLOAD_DIR = process.env.UPLOAD_DIR;
const ORIGINAL_SELFIE_DIR = process.env.ATTENDANCE_SELFIE_DIR;
const ORIGINAL_MAX_SIZE = process.env.MAX_SELFIE_SIZE_MB;

beforeAll(async () => {
  await rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
  await mkdir(TEST_UPLOAD_DIR, { recursive: true });
  process.env.UPLOAD_DIR = TEST_UPLOAD_DIR;
  process.env.ATTENDANCE_SELFIE_DIR = 'attendance-selfies';
  process.env.MAX_SELFIE_SIZE_MB = '1';
});

afterAll(async () => {
  if (ORIGINAL_UPLOAD_DIR === undefined) {
    delete process.env.UPLOAD_DIR;
  } else {
    process.env.UPLOAD_DIR = ORIGINAL_UPLOAD_DIR;
  }
  if (ORIGINAL_SELFIE_DIR === undefined) {
    delete process.env.ATTENDANCE_SELFIE_DIR;
  } else {
    process.env.ATTENDANCE_SELFIE_DIR = ORIGINAL_SELFIE_DIR;
  }
  if (ORIGINAL_MAX_SIZE === undefined) {
    delete process.env.MAX_SELFIE_SIZE_MB;
  } else {
    process.env.MAX_SELFIE_SIZE_MB = ORIGINAL_MAX_SIZE;
  }
  await rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
});

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MINIMAL_PNG = Buffer.concat([PNG_HEADER, Buffer.alloc(64, 0)]);

function makeFile(buffer: Buffer, mime: string, name = 'selfie.png'): File {
  // Node 22 ships with a global File constructor compatible with Web File API.
  return new File([buffer], name, { type: mime });
}

describe('attendance selfie storage', () => {
  it('builds structured object key with year/month/employeeId/attendanceId-type pattern', async () => {
    const { buildAttendanceSelfieKey } = await import('@/lib/upload');

    const key = buildAttendanceSelfieKey({
      employeeId: 'emp_123',
      attendanceId: 'att_456',
      type: 'check-in',
      extension: 'webp',
      date: new Date(Date.UTC(2026, 4, 17)),
    });

    expect(key).toBe('attendance-selfies/2026/05/emp_123/att_456-checkin.webp');
  });

  it('rejects invalid MIME types', async () => {
    const { saveAttendanceSelfie, UploadError } = await import('@/lib/upload');
    const file = makeFile(Buffer.from('hello'), 'image/gif');

    await expect(
      saveAttendanceSelfie({
        file,
        employeeId: 'emp_mime',
        attendanceId: 'att_mime',
        type: 'check-in',
      }),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it('rejects empty selfies', async () => {
    const { saveAttendanceSelfie, UploadError } = await import('@/lib/upload');
    const file = makeFile(Buffer.alloc(0), 'image/png');

    await expect(
      saveAttendanceSelfie({
        file,
        employeeId: 'emp_empty',
        attendanceId: 'att_empty',
        type: 'check-in',
      }),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it('rejects oversized selfies above MAX_SELFIE_SIZE_MB', async () => {
    const { saveAttendanceSelfie, UploadError } = await import('@/lib/upload');
    const oversized = Buffer.concat([PNG_HEADER, Buffer.alloc(2 * 1024 * 1024, 0)]);
    const file = makeFile(oversized, 'image/png');

    await expect(
      saveAttendanceSelfie({
        file,
        employeeId: 'emp_big',
        attendanceId: 'att_big',
        type: 'check-in',
      }),
    ).rejects.toBeInstanceOf(UploadError);
  });

  it('saves valid selfie to disk and returns metadata, never base64', async () => {
    const { saveAttendanceSelfie } = await import('@/lib/upload');
    const file = makeFile(MINIMAL_PNG, 'image/png', 'ignored-by-server.png');

    const result = await saveAttendanceSelfie({
      file,
      employeeId: 'emp_ok',
      attendanceId: 'att_ok',
      type: 'check-in',
    });

    expect(result.path.startsWith('/api/attendance/selfie/attendance-selfies/')).toBe(true);
    expect(result.path).toContain('emp_ok');
    expect(result.path).toContain('att_ok-checkin');
    expect(result.storageKey.startsWith('attendance-selfies/')).toBe(true);
    expect(result.storageKey).toContain('emp_ok/att_ok-checkin');
    expect(result.mimeType).toBe('image/png');
    expect(result.size).toBe(MINIMAL_PNG.length);
    expect(result.path).not.toContain('base64');
    // Filename is regenerated server-side; original name is discarded.
    expect(result.filename).not.toBe('ignored-by-server.png');

    const onDisk = await stat(
      path.join(TEST_UPLOAD_DIR, result.path.replace('/api/attendance/selfie/', '')),
    );
    expect(onDisk.size).toBe(MINIMAL_PNG.length);
  });

  it('resolveSelfieStoragePath blocks path traversal', async () => {
    const { resolveSelfieStoragePath } = await import('@/lib/upload');

    expect(resolveSelfieStoragePath('../etc/passwd')).toBeNull();
    expect(resolveSelfieStoragePath('attendance-selfies/../../etc/passwd')).toBeNull();
    expect(resolveSelfieStoragePath('/absolute/path.webp')).toBeNull();
    expect(resolveSelfieStoragePath('attendance-selfies\\evil.webp')).toBeNull();
  });

  it('resolveSelfieStoragePath supports legacy flat filenames and structured keys', async () => {
    const { resolveSelfieStoragePath } = await import('@/lib/upload');

    const legacy = resolveSelfieStoragePath('legacy123.jpg');
    const structured = resolveSelfieStoragePath('attendance-selfies/2026/05/emp/att-checkin.webp');
    expect(legacy?.endsWith(path.join('selfies', 'legacy123.jpg'))).toBe(true);
    expect(
      structured?.endsWith(
        path.join('attendance-selfies', '2026', '05', 'emp', 'att-checkin.webp'),
      ),
    ).toBe(true);
  });
});
