import { describe, it, expect, vi } from 'vitest';

// Mock the filesystem so the save functions exercise their logic without I/O.
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
}));

import { saveUploadedImage, saveAttendanceSelfie } from '@/lib/upload';

/**
 * Tests for the upload save functions with the filesystem mocked. A valid JPEG
 * magic-byte buffer passes validateImageBuffer; mkdir/writeFile are stubbed.
 */
describe('upload save functions (fs mocked)', () => {
  function jpegFile(): File {
    const buf = new Uint8Array(2048);
    buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff; buf[3] = 0xe0; // JPEG signature
    return new File([buf], 'x.jpg', { type: 'image/jpeg' });
  }

  it('saveUploadedImage: validates and writes the image', async () => {
    const result = await saveUploadedImage(jpegFile());
    expect(result).toBeDefined();
  });

  it('saveAttendanceSelfie: validates and writes the selfie', async () => {
    const result = await saveAttendanceSelfie({
      file: jpegFile(), employeeId: 'e1', attendanceId: 'a1', type: 'check-in',
    });
    expect(result).toBeDefined();
  });
});
