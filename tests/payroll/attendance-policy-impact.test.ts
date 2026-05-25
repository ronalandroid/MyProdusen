import { describe, expect, it } from 'vitest';
import { calculateAttendancePayrollImpact, DEFAULT_ATTENDANCE_POLICY } from '@/services/attendance/attendance-payroll-impact.service';

const baseInput = {
  employeeId: 'emp_1',
  shiftStartAt: new Date('2026-05-26T01:00:00.000Z'), // 08:00 Asia/Jakarta
  attendancePolicy: DEFAULT_ATTENDANCE_POLICY,
  timezone: 'Asia/Jakarta' as const,
};

describe('calculateAttendancePayrollImpact', () => {
  it.each([
    ['08:00 exact', '2026-05-26T01:00:00.000Z', 0, 0, false],
    ['08:01 tier 1', '2026-05-26T01:01:00.000Z', 1, 5000, false],
    ['08:15 tier 1 edge', '2026-05-26T01:15:00.000Z', 15, 5000, false],
    ['08:16 tier 2', '2026-05-26T01:16:00.000Z', 16, 10000, false],
    ['08:30 tier 2 edge', '2026-05-26T01:30:00.000Z', 30, 10000, false],
    ['08:31 half day', '2026-05-26T01:31:00.000Z', 31, 0, true],
  ])('%s', (_label, clockInIso, lateMinutes, deduction, isHalfDay) => {
    const result = calculateAttendancePayrollImpact({
      ...baseInput,
      clockInAt: new Date(clockInIso),
    });

    expect(result.lateMinutes).toBe(lateMinutes);
    expect(result.lateDeduction).toBe(deduction);
    expect(result.isHalfDay).toBe(isHalfDay);
    expect(result.payFactor).toBe(isHalfDay ? 0.5 : 1);
  });

  it('uses custom policy overrides instead of fixed defaults', () => {
    const result = calculateAttendancePayrollImpact({
      ...baseInput,
      clockInAt: new Date('2026-05-26T01:07:00.000Z'),
      attendancePolicy: {
        ...DEFAULT_ATTENDANCE_POLICY,
        lateTier1Min: 1,
        lateTier1Max: 10,
        lateTier1Deduction: 7000,
        lateTier2Min: 11,
        lateTier2Max: 20,
        lateTier2Deduction: 12000,
        halfDayAfterMinutes: 20,
      },
    });

    expect(result.lateMinutes).toBe(7);
    expect(result.lateDeduction).toBe(7000);
    expect(result.isHalfDay).toBe(false);
  });

  it('disables payroll sync impact when policy turns sync off', () => {
    const result = calculateAttendancePayrollImpact({
      ...baseInput,
      clockInAt: new Date('2026-05-26T01:10:00.000Z'),
      attendancePolicy: {
        ...DEFAULT_ATTENDANCE_POLICY,
        payrollSyncEnabled: false,
      },
    });

    expect(result.payrollImpactStatus).toBe('SYNC_DISABLED');
    expect(result.shouldCreatePayrollHistory).toBe(false);
  });

  it('marks payroll history when sync enabled and impact exists', () => {
    const result = calculateAttendancePayrollImpact({
      ...baseInput,
      clockInAt: new Date('2026-05-26T01:31:00.000Z'),
      baseDailyPay: 100000,
    });

    expect(result.payrollImpactStatus).toBe('PENDING_SYNC');
    expect(result.shouldCreatePayrollHistory).toBe(true);
    expect(result.estimatedPayrollAmount).toBe(-50000);
  });

  it('applies holiday multiplier when employee works on paid holiday', () => {
    const result = calculateAttendancePayrollImpact({
      ...baseInput,
      clockInAt: new Date('2026-05-26T01:00:00.000Z'),
      baseDailyPay: 100000,
      workCalendarDay: {
        type: 'COMPANY_HOLIDAY',
        isPaidHoliday: true,
        payMultiplier: 2,
      },
      payrollRule: {
        holidayMultiplierEnabled: true,
        realtimeCalculationEnabled: true,
      },
    });

    expect(result.holidayMultiplier).toBe(2);
    expect(result.estimatedPayrollAmount).toBe(100000);
    expect(result.shouldCreatePayrollHistory).toBe(true);
  });
});
