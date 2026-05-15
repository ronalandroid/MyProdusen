import { describe, expect, it } from 'vitest';
import { buildSelfServiceSections } from '@/lib/employee/self-service-hub';

describe('self-service hub sections', () => {
  it('creates employee daily HR sections in priority order', () => {
    const sections = buildSelfServiceSections({
      attendanceStatus: 'checked-in',
      leaveAvailable: 8,
      pendingRequests: 2,
      kpiScore: 87,
      unreadNotifications: 3,
    });

    expect(sections.map((section) => section.title)).toEqual([
      'Absensi Hari Ini',
      'Saldo Cuti',
      'Pengajuan Saya',
      'KPI Saya',
      'Notifikasi',
      'Dokumen & Slip Gaji',
    ]);
    expect(sections[0]).toMatchObject({ href: '/dashboard/attendance', tone: 'success' });
  });
});
