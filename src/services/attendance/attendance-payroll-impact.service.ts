export type AttendancePolicyScopeType = 'COMPANY' | 'TEAM' | 'EMPLOYEE';
export type WorkCalendarDayType = 'WORKDAY' | 'HOLIDAY' | 'COMPANY_HOLIDAY' | 'SPECIAL_WORKDAY';
export type PayrollImpactStatus = 'NO_IMPACT' | 'SYNC_DISABLED' | 'PENDING_SYNC';

export interface AttendancePayrollPolicy {
  graceMinutes: number;
  lateTier1Min: number;
  lateTier1Max: number;
  lateTier1Deduction: number;
  lateTier2Min: number;
  lateTier2Max: number;
  lateTier2Deduction: number;
  halfDayAfterMinutes: number;
  halfDayPayFactor: number;
  geofenceRadiusMeters: number;
  payrollSyncEnabled: boolean;
}

export interface WorkCalendarDayPolicy {
  type: WorkCalendarDayType;
  isPaidHoliday: boolean;
  payMultiplier: number;
}

export interface PayrollRulePolicy {
  holidayMultiplierEnabled?: boolean;
  realtimeCalculationEnabled?: boolean;
}

export interface CalculateAttendancePayrollImpactInput {
  employeeId: string;
  shiftStartAt: Date;
  clockInAt: Date;
  attendancePolicy: AttendancePayrollPolicy;
  timezone: 'Asia/Jakarta' | string;
  workCalendarDay?: WorkCalendarDayPolicy | null;
  baseDailyPay?: number | null;
  payrollRule?: PayrollRulePolicy | null;
}

export interface AttendancePayrollImpactResult {
  employeeId: string;
  lateMinutes: number;
  lateDeduction: number;
  isHalfDay: boolean;
  payFactor: number;
  holidayMultiplier: number;
  payrollImpactStatus: PayrollImpactStatus;
  shouldCreatePayrollHistory: boolean;
  estimatedPayrollAmount: number;
  calculationSnapshot: Record<string, unknown>;
}

export const DEFAULT_ATTENDANCE_POLICY: AttendancePayrollPolicy = {
  graceMinutes: 0,
  lateTier1Min: 1,
  lateTier1Max: 15,
  lateTier1Deduction: 5000,
  lateTier2Min: 16,
  lateTier2Max: 30,
  lateTier2Deduction: 10000,
  halfDayAfterMinutes: 30,
  halfDayPayFactor: 0.5,
  geofenceRadiusMeters: 150,
  payrollSyncEnabled: true,
};

function positiveNumber(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function diffInWholeMinutes(clockInAt: Date, shiftStartAt: Date) {
  return Math.max(0, Math.floor((clockInAt.getTime() - shiftStartAt.getTime()) / 60_000));
}

export function calculateAttendancePayrollImpact(
  input: CalculateAttendancePayrollImpactInput,
): AttendancePayrollImpactResult {
  const policy = { ...DEFAULT_ATTENDANCE_POLICY, ...input.attendancePolicy };
  const lateMinutesRaw = diffInWholeMinutes(input.clockInAt, input.shiftStartAt);
  const lateMinutes = Math.max(0, lateMinutesRaw - positiveNumber(policy.graceMinutes, 0));
  const isHalfDay = lateMinutes > policy.halfDayAfterMinutes;
  const lateDeduction = isHalfDay
    ? 0
    : lateMinutes >= policy.lateTier1Min && lateMinutes <= policy.lateTier1Max
      ? policy.lateTier1Deduction
      : lateMinutes >= policy.lateTier2Min && lateMinutes <= policy.lateTier2Max
        ? policy.lateTier2Deduction
        : 0;

  const payFactor = isHalfDay ? policy.halfDayPayFactor : 1;
  const holidayMultiplier =
    input.workCalendarDay?.isPaidHoliday && input.payrollRule?.holidayMultiplierEnabled !== false
      ? positiveNumber(input.workCalendarDay.payMultiplier, 1)
      : 1;
  const baseDailyPay = positiveNumber(input.baseDailyPay, 0);
  const halfDayImpact = isHalfDay && baseDailyPay > 0 ? -(baseDailyPay * (1 - payFactor)) : 0;
  const holidayImpact = holidayMultiplier > 1 && baseDailyPay > 0 ? baseDailyPay * (holidayMultiplier - 1) : 0;
  const estimatedPayrollAmount = holidayImpact + halfDayImpact - lateDeduction;
  const hasImpact = lateDeduction > 0 || isHalfDay || holidayMultiplier > 1;
  const syncEnabled = policy.payrollSyncEnabled && input.payrollRule?.realtimeCalculationEnabled !== false;
  const payrollImpactStatus: PayrollImpactStatus = !hasImpact
    ? 'NO_IMPACT'
    : syncEnabled
      ? 'PENDING_SYNC'
      : 'SYNC_DISABLED';

  return {
    employeeId: input.employeeId,
    lateMinutes,
    lateDeduction,
    isHalfDay,
    payFactor,
    holidayMultiplier,
    payrollImpactStatus,
    shouldCreatePayrollHistory: payrollImpactStatus === 'PENDING_SYNC',
    estimatedPayrollAmount,
    calculationSnapshot: {
      timezone: input.timezone,
      shiftStartAt: input.shiftStartAt.toISOString(),
      clockInAt: input.clockInAt.toISOString(),
      policy,
      workCalendarDay: input.workCalendarDay ?? null,
      baseDailyPay,
      payrollRule: input.payrollRule ?? null,
    },
  };
}
