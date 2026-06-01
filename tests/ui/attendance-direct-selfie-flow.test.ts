import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const employeeDashboard = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const leaderDashboard = readFileSync('src/components/dashboard/LeaderBeranda.tsx', 'utf8');
const attendancePage = readFileSync('app/dashboard/attendance/page.tsx', 'utf8');
const capturePage = readFileSync('app/dashboard/attendance/clock/page.tsx', 'utf8');
const camera = readFileSync('src/components/attendance/RealtimeSelfieCamera.tsx', 'utf8');

describe('direct attendance selfie flow source contract', () => {
  it('shows one primary Absensi Hari Ini CTA for employee and leader', () => {
    for (const source of [employeeDashboard, leaderDashboard]) {
      expect(source).toContain('Absensi Hari Ini');
      expect(source).toContain('Clock In');
      expect(source).toContain('Clock Out');
      expect(source).toContain('Absensi Selesai');
      expect(source).toContain('Ajukan Koreksi Manual');
      expect(source).toContain('/dashboard/attendance/clock?type=clock-in');
      expect(source).toContain('/dashboard/attendance/clock?type=clock-out');
    }
  });

  it('attendance capture flow exposes selfie, GPS, radius, distance, and submit labels', () => {
    expect(attendancePage).toContain('Absensi Hari Ini');
    expect(attendancePage).toContain('Bukti Lokasi GPS');
    expect(attendancePage).toContain('Jarak ke lokasi');
    expect(attendancePage).toContain('Radius resmi');
    expect(capturePage).toContain('Kirim Clock In');
    expect(capturePage).toContain('Kirim Clock Out');
    expect(camera).toContain('Ambil Selfie');
    expect(camera).toContain('Kamera tidak dapat diakses. Izinkan kamera di browser Anda.');
  });
});
