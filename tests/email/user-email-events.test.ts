import { describe, expect, it } from 'vitest';
import { getUserEmailEvents } from '@/lib/email';

describe('user email event selection', () => {
  it('sends account approval only when user becomes active', () => {
    expect(getUserEmailEvents({ role: 'EMPLOYEE', isActive: false }, { role: 'EMPLOYEE', isActive: true })).toEqual(['account-approved']);
  });

  it('does not send account approval for already active user updates', () => {
    expect(getUserEmailEvents({ role: 'EMPLOYEE', isActive: true }, { role: 'EMPLOYEE', isActive: true })).toEqual([]);
  });

  it('sends role changed only when role changes', () => {
    expect(getUserEmailEvents({ role: 'EMPLOYEE', isActive: true }, { role: 'ADMIN_HR', isActive: true })).toEqual(['role-changed']);
  });
});
