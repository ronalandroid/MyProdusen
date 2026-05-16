import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const attendancePageSource = readFileSync('app/dashboard/attendance/page.tsx', 'utf8');
const realtimeCameraSource = readFileSync('src/components/attendance/RealtimeSelfieCamera.tsx', 'utf8');

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
    expect(realtimeCameraSource).toContain('canvas.toBlob');
  });
});
