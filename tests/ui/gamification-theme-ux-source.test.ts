import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const employee = readFileSync('src/components/dashboard/EmployeeBeranda.tsx', 'utf8');
const leader = readFileSync('app/dashboard/leader/team/page.tsx', 'utf8');
const dashboard = readFileSync('features/dashboard/SuperadminDashboard.tsx', 'utf8');
const settings = readFileSync('app/dashboard/settings/page.tsx', 'utf8');

describe('Gamification, Theme, and Perceived-Speed UX UI safeguards', () => {
  it('employee score card, active tier, breakdown, badges, and raise projection banner exist', () => {
    // Score Card
    expect(employee).toContain('Skor Performa');
    expect(employee).toContain('Indeks Performa Kumulatif');
    expect(employee).toContain('Tier');
    
    // Breakdown
    expect(employee).toContain('Kehadiran (Bobot 30%)');
    expect(employee).toContain('KPI Produksi (Bobot 50%)');
    expect(employee).toContain('Perilaku Kerja (Bobot 20%)');

    // Subcriteria
    expect(employee).toContain('Kebersihan');
    expect(employee).toContain('Disiplin');
    expect(employee).toContain('Kerapian');
    expect(employee).toContain('Kepatuhan SOP');
    expect(employee).toContain('Kerja Sama Tim');
    expect(employee).toContain('Tanggung Jawab');

    // Raise projection banner & message
    expect(employee).toContain('Proyeksi Kenaikan Gaji');
    expect(employee).toContain('estimasi kenaikan gaji tahun depan:');
    expect(employee).toContain('Pertahankan skor 100 selama 365 hari untuk peluang kenaikan hingga 10%.');
    expect(employee).toContain('raiseProjectionDisclaimer');
    
    // Badge showcase
    expect(employee).toContain('Showcase Badge');
    expect(employee).toContain('perfBadges');
    
    // Score history SVG chart
    expect(employee).toContain('Tren Skor 7 Hari Terakhir');
    expect(employee).toContain('svg');
    expect(employee).toContain('path');
    
    // Latest score change note
    expect(employee).toContain('Catatan Perubahan Terakhir:');
  });

  it('leader team management includes score inputs, anomaly warnings, and leaderboard', () => {
    // Leader score inputs
    expect(leader).toContain('Input Penilaian Perilaku Tim');
    expect(leader).toContain('Input Skor Perilaku Kerja (0–100)');
    
    // Subcriteria sliders
    expect(leader).toContain('Input Subkriteria Nilai (Opsional)');
    expect(leader).toContain('Kebersihan');
    expect(leader).toContain('Disiplin');
    expect(leader).toContain('Kerapian');
    expect(leader).toContain('Kepatuhan SOP');
    expect(leader).toContain('Kerja Sama Tim');
    expect(leader).toContain('Tanggung Jawab');

    // Notes validation
    expect(leader).toContain('notes.length < 10');
    expect(leader).toContain('Notes/catatan minimal 10 karakter.');

    // Anomaly warnings
    expect(leader).toContain('isLowScoreAnomaly');
    expect(leader).toContain('isDeltaAnomaly');
    expect(leader).toContain('Peringatan: Skor di bawah 40 tergolong sangat rendah');
    expect(leader).toContain('Peringatan: Perubahan skor yang sangat drastis');

    // Team leaderboard
    expect(leader).toContain('Leaderboard Tim');
    
    // No private salary info
    expect(leader).not.toContain('baseSalary');
    expect(leader).not.toContain('raisePercent');
  });

  it('superadmin has performance overview, tier distribution, raise projection, anomaly queue, and config', () => {
    // Overview & Distributions
    expect(dashboard).toContain('SuperadminGamificationHub');
    expect(dashboard).toContain('Distribusi Tier Performa');
    expect(dashboard).toContain('tierCounts');

    // Raise budget projection
    expect(dashboard).toContain('totalProjectedRaiseAmount');
    
    // Top & At-risk employees
    expect(dashboard).toContain('Top Performers');
    expect(dashboard).toContain('Karyawan Berisiko');
    
    // Anomaly queue & audit overrides
    expect(dashboard).toContain('Antrean Review Anomali Penilaian Perilaku');
    expect(dashboard).toContain('overrideLeaderScoreInput');
    expect(dashboard).toContain('Alasan override minimal 10 karakter.');
    expect(dashboard).toContain('override');

    // Superadmin subcriteria sliders
    expect(dashboard).toContain('adminSubcriteriaEnabled');
    expect(dashboard).toContain('Kebersihan');
    expect(dashboard).toContain('Disiplin');
    expect(dashboard).toContain('Kerapian');
    expect(dashboard).toContain('Kepatuhan SOP');
    expect(dashboard).toContain('Kerja Sama Tim');
    expect(dashboard).toContain('Tanggung Jawab');
    expect(dashboard).toContain('Nilai Superadmin menjadi nilai final jika sudah diisi.');
  });

  it('theme customizer color wheel, reset button, and contrast check exist', () => {
    // Palette/Warna Tema
    expect(settings).toContain('Warna Tema Brand');
    
    // Color Pickers
    expect(settings).toContain('primaryColor');
    expect(settings).toContain('secondaryColor');
    expect(settings).toContain('accentColor');
    expect(settings).toContain('type="color"');

    // Live Contrast check and warnings
    expect(settings).toContain('calculateContrast');
    expect(settings).toContain('isContrastValid');
    expect(settings).toContain('Peringatan: Kontras warna antara Brand Utama dan Teks Utama terlalu rendah');
    expect(settings).toContain('Rasio kontras');

    // Reset button
    expect(settings).toContain('Reset ke Default');
    expect(settings).toContain('handleResetTheme');
  });

  it('skeleton screens and safe perceived speed states are fully implemented in source code', () => {
    // Skeleton cards for loading states
    expect(employee).toContain('isPerfLoading');
    expect(employee).toContain('animate-pulse');
    expect(employee).toContain('bg-gray-200');

    expect(leader).toContain('loading');
    expect(leader).toContain('animate-pulse');

    // Exact progress states
    expect(employee).toContain('Memuat skor performa…');
    expect(employee).toContain('Menghitung proyeksi kenaikan…');
    expect(leader).toContain('Memproses Penilaian Perilaku…');
    expect(leader).toContain('Memeriksa anomali…');
    expect(settings).toContain('Menyimpan tema...');
    expect(settings).toContain('Memvalidasi bobot skor...');

    // No fake optimistic success for attendance or payroll (loads from fetches or requests)
    expect(employee).not.toContain('fakeAttendanceSuccess');
    expect(employee).not.toContain('fakePayrollSuccess');
  });
});
