import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const button = readFileSync('src/components/ui/Button.tsx', 'utf8');
const modal = readFileSync('src/components/ui/Modal.tsx', 'utf8');
const globals = readFileSync('app/globals.css', 'utf8');
const attendance = readFileSync('app/dashboard/attendance/page.tsx', 'utf8');
const reportAttendance = readFileSync('app/dashboard/reports/attendance/page.tsx', 'utf8');
const employees = readFileSync('app/dashboard/employees/page.tsx', 'utf8');
const audit = readFileSync('app/dashboard/audit/page.tsx', 'utf8');
const input = readFileSync('src/components/ui/Input.tsx', 'utf8');
const camera = readFileSync('src/components/attendance/RealtimeSelfieCamera.tsx', 'utf8');
const compressor = readFileSync('lib/attendance/selfie-compressor.ts', 'utf8');
const tailwind = readFileSync('tailwind.config.ts', 'utf8');

describe('UI layout and attendance UX source safeguards', () => {
  it('keeps buttons from clipping icon labels', () => {
    expect(button).toContain('inline-flex max-w-full');
    expect(button).toContain('className="min-w-0 text-center"');
    expect(globals).toContain('overflow-wrap: anywhere');
    expect(reportAttendance).not.toContain('className="mr-2"');
    expect(reportAttendance).toContain('grid w-full grid-cols-1 gap-2');
  });

  it('stacks and wraps modal footer actions safely', () => {
    expect(modal).toContain('modal-footer-actions');
    expect(globals).toContain('flex-direction: column-reverse');
    expect(globals).toContain('min-width: 104px');
    expect(modal).toContain('aria-label="Tutup modal"');
  });

  it('does not expose raw attendance runtime errors to users', () => {
    expect(attendance).not.toContain('getCleanAttendanceError');
    expect(attendance).not.toContain('Data absensi belum tersedia.');
    expect(attendance).not.toContain('Cannot read properties');
    expect(attendance).not.toContain('GPS belum siap');
    expect(attendance).not.toContain('Selfie wajib diambil');
  });


  it('keeps search input and pagination readable at narrow widths', () => {
    expect(input).toContain('min-h-[44px] w-full min-w-0');
    expect(input).toContain('flex h-5 w-5');
    expect(globals).toContain('min-width: 72px');
    expect(globals).toContain('pagination-info');
    expect(reportAttendance).toContain('pagination-compact');
    expect(reportAttendance).toContain('Reset filter');
    expect(audit).toContain('pagination-compact');
  });

  it('mirrors realtime selfie preview and captured canvas', () => {
    expect(camera).toContain('transform: "scaleX(-1)"');
    expect(camera).toContain('captureSelfieFromVideo(video, true)');
    expect(compressor).toContain('mirror = true');
    expect(compressor).toContain('ctx.translate(width, 0)');
    expect(compressor).toContain('ctx.scale(-1, 1)');
  });

  it('keeps Tailwind scanning live source components for production CSS', () => {
    expect(tailwind).toContain('./src/**/*.{js,ts,jsx,tsx,mdx}');
    expect(tailwind).toContain('./app/**/*.{js,ts,jsx,tsx,mdx}');
  });

  it('guards employee delete modal when selected data is unavailable', () => {
    expect(employees).toContain('Data karyawan tidak tersedia');
    expect(employees).toContain('disabled={!selectedEmployee || submitting}');
  });
});
