import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const attendanceListPageSource = readFileSync('app/dashboard/attendance/page.tsx', 'utf8');
const attendanceClockPageSource = readFileSync('app/dashboard/attendance/clock/page.tsx', 'utf8');
const attendancePageSource = `${attendanceListPageSource}\n${attendanceClockPageSource}`;
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

it('hides employee-style selfie attendance actions from Superadmin users', () => {
  expect(attendancePageSource).toContain('isSuperadminAttendanceViewer');
  expect(attendancePageSource).toContain('Laporan Kehadiran');
  expect(attendancePageSource).toContain('Approval Absensi');
  expect(attendancePageSource).not.toMatch(/profile\?\.role === "SUPERADMIN"[\s\S]{0,900}<RealtimeSelfieCamera/);
});

it('shows realtime distance and official radius in human-friendly meters or kilometers', () => {
  expect(attendancePageSource).toContain('formatDistanceMeters');
  expect(attendancePageSource).toContain('Jarak Anda:');
  expect(attendancePageSource).toContain('Radius diizinkan:');
  expect(attendancePageSource).toContain('Status:');
  expect(attendancePageSource).toContain('Di luar radius');
  expect(attendancePageSource).toContain('.toFixed(1)');
});

it('stops camera tracks and clears video source during cleanup', () => {
  expect(realtimeCameraSource).toContain('track.stop()');
  expect(realtimeCameraSource).toContain('videoRef.current.pause()');
  expect(realtimeCameraSource).toContain('videoRef.current.srcObject = null');
  expect(realtimeCameraSource).toContain('useEffect(() => stopCamera, [])');
});

describe('Immersive selfie capture UI (reference-style)', () => {
  it('uses a full-bleed camera surface instead of a small card', () => {
    expect(realtimeCameraSource).toContain('min(68vh, 540px)');
    expect(realtimeCameraSource).not.toContain('min(60vh, 320px)');
  });

  it('guides with a head + shoulders silhouette, not a plain oval', () => {
    expect(realtimeCameraSource).toContain('Panduan posisi kepala dan bahu');
    expect(realtimeCameraSource).toContain('viewBox="0 0 200 270"');
    expect(realtimeCameraSource).toContain('<ellipse');
    expect(realtimeCameraSource).toContain('M26,262');
  });

  it('colours liveness states with MyProdusen brand tokens', () => {
    expect(realtimeCameraSource).toContain('var(--attn-success)');
    expect(realtimeCameraSource).toContain('var(--primary)');
    expect(realtimeCameraSource).toContain('var(--danger)');
  });

  it('keeps the realtime liveness gate mandatory before capture', () => {
    expect(realtimeCameraSource).toContain('livenessAllowsCapture');
    expect(realtimeCameraSource).toContain('GOOD_FRAMES_TO_PASS');
  });
});
