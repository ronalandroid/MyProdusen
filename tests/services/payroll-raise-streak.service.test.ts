import { describe, expect, it } from 'vitest';
import { calculateSimplePayroll } from '@/src/services/payroll/simple-payroll.service';
import { calculateProjectedRaisePercent } from '@/src/services/gamification/raise-projection.service';
import { calculateBestStreak, calculateCurrentStreak, mapDayStatus } from '@/src/services/attendance/attendance-streak.service';

describe('simple payroll calculator', () => {
  it('calculates base salary 300000 plus KPI bonus 60000 as 360000 net pay', () => {
    const result = calculateSimplePayroll({ baseSalary: 300000, kpiBonus: 60000 });
    expect(result.gross).toBe(360000);
    expect(result.netPay).toBe(360000);
    expect(result.breakdown).toContainEqual({ label: 'Bonus KPI', amount: 60000, type: 'earning' });
  });
});

describe('raise projection service', () => {
  it.each([[100, 10], [80, 8], [60, 6], [0, 0]])('maps annual score %i to projected raise %i', (score, raise) => {
    expect(calculateProjectedRaisePercent(score)).toBe(raise);
  });
});

describe('attendance streak service', () => {
  const days = [
    { date: '2026-01-01', status: 'PRESENT' as const },
    { date: '2026-01-02', status: 'HOLIDAY' as const },
    { date: '2026-01-03', status: 'LEAVE' as const },
    { date: '2026-01-04', status: 'PRESENT' as const },
    { date: '2026-01-05', status: 'ABSENT' as const },
    { date: '2026-01-06', status: 'PRESENT' as const },
  ];

  it('does not break streak on holiday or approved leave, but absent breaks streak', () => {
    expect(calculateBestStreak(days)).toBe(4);
    expect(calculateCurrentStreak(days)).toBe(1);
    expect(mapDayStatus({ present: true })).toBe('PRESENT');
    expect(mapDayStatus({ isHoliday: true })).toBe('HOLIDAY');
    expect(mapDayStatus({ approvedLeave: true })).toBe('LEAVE');
  });
});
