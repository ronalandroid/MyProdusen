import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const service = readFileSync('src/services/leave/leave.service.ts', 'utf8');
const route = readFileSync('app/api/leave/route.ts', 'utf8');

describe('leave balance insufficient guard source contract', () => {
  it('checks available leave balance before creating leave requests', () => {
    expect(service).toContain("import { calculateLeaveDays } from '@/lib/leave/balance-ledger';");
    expect(service).toContain("if (data.type === 'LEAVE')");
    expect(service).toContain('leaveBalanceService.getBalance');
    expect(service).toContain('balance.available < requestedDays');
    expect(service).toContain("(error as any).code = 'LEAVE_BALANCE_INSUFFICIENT';");
  });

  it('returns explicit insufficient balance response from API route', () => {
    expect(route).toContain("error.code === 'LEAVE_BALANCE_INSUFFICIENT'");
    expect(route).toContain("return errorResponse(error.message || 'Saldo cuti tidak cukup', 400);");
  });
});
