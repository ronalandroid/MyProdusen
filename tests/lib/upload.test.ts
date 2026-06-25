import { describe, it, expect } from 'vitest';
import {
  buildAttendanceSelfieKey,
  buildProfileAvatarKey,
  validateImageFile,
  MAX_IMAGE_BYTES,
} from '@/lib/upload';

/**
 * Unit tests for the pure upload helpers — storage-key builders and
 * validateImageFile (empty / wrong-type / oversized branches + mime
 * normalization). No filesystem I/O.
 */
describe('upload key builders + validateImageFile (pure)', () => {
  it('buildAttendanceSelfieKey: encodes employee/date/type/extension', () => {
    const key = buildAttendanceSelfieKey({
      employeeId: 'e1', attendanceId: 'a1', type: 'check-in', extension: 'jpg',
      date: new Date(Date.UTC(2099, 2, 15)),
    });
    expect(key).toContain('e1');
    expect(key).toContain('2099');
    expect(key).toContain('checkin');
    expect(key.endsWith('.jpg')).toBe(true);

    const out = buildAttendanceSelfieKey({ employeeId: 'e1', attendanceId: 'a1', type: 'check-out', extension: 'png' });
    expect(out).toContain('checkout');
  });

  it('buildProfileAvatarKey: encodes employee + extension', () => {
    const key = buildProfileAvatarKey({ employeeId: 'e1', extension: 'png' });
    expect(key).toContain('e1');
    expect(key.endsWith('.png')).toBe(true);
  });

  it('validateImageFile: rejects empty/wrong-type/oversized, accepts a valid image', () => {
    expect(() => validateImageFile(new File([], 'x.jpg', { type: 'image/jpeg' }))).toThrow(/wajib/i);
    expect(() => validateImageFile(new File(['hello'], 'x.txt', { type: 'text/plain' }))).toThrow(/tidak valid/i);
    expect(() => validateImageFile(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'x.jpg', { type: 'image/jpeg' }))).toThrow(/terlalu besar/i);
    // 'image/jpg' must be normalized to image/jpeg and accepted
    expect(() => validateImageFile(new File(['x'.repeat(100)], 'x.jpg', { type: 'image/jpg' }))).not.toThrow();
  });
});
