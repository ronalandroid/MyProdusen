import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const employeeDashboard = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const leaderDashboard = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const capturePagePath = 'app/dashboard/attendance/capture/page.tsx';
const capturePage = existsSync(capturePagePath) ? readFileSync(capturePagePath, 'utf8') : '';
const camera = readFileSync('src/components/attendance/RealtimeSelfieCamera.tsx', 'utf8');
const checkInRoute = readFileSync('app/api/attendance/check-in/route.ts', 'utf8');
const checkOutRoute = readFileSync('app/api/attendance/check-out/route.ts', 'utf8');

describe('mobile attendance clocking UX source contract', () => {
  it('dashboard attendance card exposes Clock In and Clock Out capture routes', () => {
    for (const source of [employeeDashboard, leaderDashboard]) {
      expect(source).toContain('Selamat pagi');
      expect(source).toContain('Jangan lupa absen hari ini!');
      expect(source).toContain('Clock In');
      expect(source).toContain('Clock Out');
      expect(source).toContain('/dashboard/attendance/capture?type=clock-in');
      expect(source).toContain('/dashboard/attendance/capture?type=clock-out');
      expect(source).toContain('Belum Absen');
      expect(source).toContain('Sudah Clock In');
      expect(source).toContain('Sudah Clock Out');
    }
  });

  it('capture screen includes camera face guide GPS note manual correction and sticky submit', () => {
    expect(capturePage).toContain('Clock In');
    expect(capturePage).toContain('Clock Out');
    expect(capturePage).toContain('Posisikan wajah di dalam frame');
    expect(capturePage).toContain('Memvalidasi lokasi');
    expect(capturePage).toContain('Akurasi');
    expect(capturePage).toContain('Jarak ke lokasi');
    expect(capturePage).toContain('Radius diizinkan');
    expect(capturePage).toContain('Catatan (opsional)');
    expect(capturePage).toContain('Ajukan Koreksi Manual');
    expect(capturePage).toContain('Kirim Clock In');
    expect(capturePage).toContain('Kirim Clock Out');
    expect(capturePage).toContain('Daftar Absensi');
    expect(capturePage).toContain('Belum ada riwayat absensi.');
  });

  it('camera and backend keep strict selfie GPS protections', () => {
    expect(camera).toContain('navigator.mediaDevices.getUserMedia');
    expect(camera).toContain('facingMode: "user"');
    expect(camera).toContain('transform: "scaleX(-1)"');
    expect(camera).toContain('getTracks().forEach((track) => track.stop())');
    expect(camera).toContain('Posisikan wajah di dalam frame');
    expect(checkInRoute).toContain("user.role !== 'EMPLOYEE' && user.role !== 'LEADER'");
    expect(checkOutRoute).toContain("user.role !== 'EMPLOYEE' && user.role !== 'LEADER'");
    expect(checkInRoute).toContain('parseCheckInRealtimeForm');
    expect(checkOutRoute).toContain('parseCheckOutRealtimeForm');
  });
});
