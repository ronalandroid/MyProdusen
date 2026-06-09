import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const files = {
  attendanceIndex: readFileSync('app/api/attendance/route.ts', 'utf8'),
  attendanceToday: readFileSync('app/api/attendance/today/route.ts', 'utf8'),
  attendanceExceptions: readFileSync('app/api/attendance/exceptions/route.ts', 'utf8'),
  checkIn: readFileSync('app/api/attendance/check-in/route.ts', 'utf8'),
  checkOut: readFileSync('app/api/attendance/check-out/route.ts', 'utf8'),
  validateLocation: readFileSync('app/api/attendance/validate-location/route.ts', 'utf8'),
  leaveIndex: readFileSync('app/api/leave/route.ts', 'utf8'),
  leaveBalance: readFileSync('app/api/leave/balance/route.ts', 'utf8'),
  leaveBalanceHistory: readFileSync('app/api/leave/balance/history/route.ts', 'utf8'),
  employeeDetail: readFileSync('app/api/employees/[id]/route.ts', 'utf8'),
  leaveDetail: readFileSync('app/api/leave/[id]/route.ts', 'utf8'),
  leaveApprove: readFileSync('app/api/leave/[id]/approve/route.ts', 'utf8'),
  leaveReject: readFileSync('app/api/leave/[id]/reject/route.ts', 'utf8'),
};

describe('employee profile null guard source contracts', () => {
  it('guards attendance and leave self-service routes before reading employee.id', () => {
    for (const key of ['attendanceIndex', 'attendanceToday', 'attendanceExceptions', 'checkIn', 'checkOut', 'validateLocation', 'leaveIndex', 'leaveBalance', 'leaveBalanceHistory'] as const) {
      expect(files[key]).toContain('Profil karyawan tidak ditemukan');
    }
  });

  it('keeps ownership helpers fail-closed when auth user has no employee profile', () => {
    expect(files.employeeDetail).toContain('!!currentEmployee && employee.id === currentEmployee.id');
    expect(files.leaveDetail).toContain('currentEmployee?.id === employeeId');
    expect(files.leaveApprove).toContain('!!supervisor && targetEmployee.supervisorId === supervisor.id');
    expect(files.leaveReject).toContain('!!supervisor && targetEmployee.supervisorId === supervisor.id');
  });
});
