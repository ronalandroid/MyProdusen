import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const employeeDashboard = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const leaderDashboard = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const clockPagePath = 'app/dashboard/attendance/clock/page.tsx';
const clockPage = existsSync(clockPagePath) ? readFileSync(clockPagePath, 'utf8') : '';
const camera = readFileSync('src/components/attendance/RealtimeSelfieCamera.tsx', 'utf8');
const checkInRoute = readFileSync('app/api/attendance/check-in/route.ts', 'utf8');
const checkOutRoute = readFileSync('app/api/attendance/check-out/route.ts', 'utf8');

describe('map-first attendance clocking flow source contract', () => {
  it('dashboard routes Clock In and Clock Out to map-first clock route', () => {
    for (const source of [employeeDashboard, leaderDashboard]) {
      expect(source).toContain('Clock In');
      expect(source).toContain('Clock Out');
      expect(source).toContain('/dashboard/attendance/clock?type=clock-in');
      expect(source).toContain('/dashboard/attendance/clock?type=clock-out');
      expect(source).toContain('Jangan lupa absen hari ini!');
    }
  });

  it('clock page starts with Validasi Lokasi map screen before selfie', () => {
    expect(clockPage).toContain('Validasi Lokasi');
    expect(clockPage).toContain('Pastikan Anda berada di area kerja sebelum melanjutkan.');
    expect(clockPage).toContain('Lokasi Anda');
    expect(clockPage).toContain('Lokasi kerja');
    expect(clockPage).toContain('Jarak ke kantor');
    expect(clockPage).toContain('Radius diizinkan');
    expect(clockPage).toContain('Mengambil lokasi Anda…');
    expect(clockPage).toContain('Lanjutkan');
    expect(clockPage).toContain('Ajukan Koreksi Manual');
    expect(clockPage).toContain('watchPosition');
    expect(clockPage).toContain('clearWatch');
    expect(clockPage).toContain('hasValidGps');
    expect(clockPage).toContain('h-[clamp(260px,55vh,420px)]');
    expect(clockPage).toContain('aria-live="polite"');
  });

  it('selfie step opens after Lanjutkan with photo wording, note, and submit labels', () => {
    expect(clockPage).toContain('Ambil Selfie Clock In');
    expect(clockPage).toContain('Ambil Selfie Clock Out');
    expect(clockPage).toContain('Ambil Foto');
    expect(clockPage).toContain('Ulangi Foto');
    expect(clockPage).toContain('Catatan (opsional)');
    expect(clockPage).toContain('Kirim Clock In');
    expect(clockPage).toContain('Kirim Clock Out');
    expect(clockPage).toContain('Daftar Absensi');
    expect(camera).toContain('Posisikan wajah di dalam frame');
    expect(camera).toContain('aria-live="assertive"');
    expect(camera).toContain('min(60vh, 320px)');
    expect(camera).toContain('touch-manipulation');
  });

  it('dashboard attendance card remains mobile-safe', () => {
    expect(employeeDashboard).toContain('touch-manipulation');
    expect(employeeDashboard).toContain('className="truncate"');
  });

  it('backend route protections remain strict', () => {
    expect(checkInRoute).toContain("user.role !== 'EMPLOYEE' && user.role !== 'LEADER'");
    expect(checkOutRoute).toContain("user.role !== 'EMPLOYEE' && user.role !== 'LEADER'");
    expect(checkInRoute).toContain('parseCheckInRealtimeForm');
    expect(checkOutRoute).toContain('parseCheckOutRealtimeForm');
  });
});
