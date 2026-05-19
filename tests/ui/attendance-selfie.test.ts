import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const attendancePageSource = readFileSync('app/dashboard/attendance/page.tsx', 'utf8');
const realtimeCameraSource = readFileSync('src/components/attendance/RealtimeSelfieCamera.tsx', 'utf8');
const selfieCompressorSource = readFileSync('lib/attendance/selfie-compressor.ts', 'utf8');

describe('Realtime attendance selfie UI', () => {
  it('does not expose manual file upload or gallery picker in attendance flow', () => {
    const source = `${attendancePageSource}\n${realtimeCameraSource}`;

    expect(source).not.toContain('type="file"');
    expect(source).not.toContain('accept="image/*"');
    expect(source).not.toContain('capture="user"');
  });

  it('uses realtime camera and canvas capture', () => {
    expect(realtimeCameraSource).toContain('navigator.mediaDevices.getUserMedia');
    expect(realtimeCameraSource).toContain('facingMode: "user"');
    expect(realtimeCameraSource).toContain('captureSelfieFromVideo');
    expect(selfieCompressorSource).toContain('canvas.toBlob');
    expect(selfieCompressorSource).toContain('ctx.translate(width, 0)');
    expect(selfieCompressorSource).toContain('ctx.scale(-1, 1)');
  });

  it('compresses selfies client-side before submitting', () => {
    expect(selfieCompressorSource).toContain('image/webp');
    expect(selfieCompressorSource).toContain('image/jpeg');
    expect(selfieCompressorSource).toMatch(/MAX_WIDTH/);
    expect(selfieCompressorSource).toMatch(/TARGET_BYTES/);
  });
});

it('keeps attendance submit gated by realtime selfie and GPS', () => {
  expect(attendancePageSource).toContain('missingRequirements');
  expect(attendancePageSource).toContain('!gpsPosition ? "GPS belum siap" : null');
  expect(attendancePageSource).toContain('!selfieBlob ? "Selfie wajib diambil" : null');
  expect(attendancePageSource).toContain('new FormData()');
  expect(attendancePageSource).toContain('formData.set("selfie", selfieBlob, selfieFilename)');
  expect(attendancePageSource).toContain('isSubmitting');
});

it('stops camera tracks and clears video source during cleanup', () => {
  expect(realtimeCameraSource).toContain('track.stop()');
  expect(realtimeCameraSource).toContain('videoRef.current.pause()');
  expect(realtimeCameraSource).toContain('videoRef.current.srcObject = null');
  expect(realtimeCameraSource).toContain('useEffect(() => stopCamera, [])');
});
