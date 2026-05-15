import { describe, it, expect } from 'vitest';
import { canManageEmployeeKpi, canReadEmployeeKpi } from '@/lib/kpi/team-scope';

describe('KPI Team Scope Policy', () => {
  it('SUPERADMIN can manage any employee KPI', () => {
    const actor = { id: 'admin-emp-1' };
    const target = { id: 'emp-2', supervisorId: 'other-supervisor' };
    expect(canManageEmployeeKpi('SUPERADMIN', actor, target)).toBe(true);
  });

  it('ADMIN_HR can manage any employee KPI', () => {
    const actor = { id: 'hr-emp-1' };
    const target = { id: 'emp-2', supervisorId: 'other-supervisor' };
    expect(canManageEmployeeKpi('ADMIN_HR', actor, target)).toBe(true);
  });

  it('SUPERVISOR can manage own team KPI', () => {
    const actor = { id: 'supervisor-emp-1' };
    const target = { id: 'emp-2', supervisorId: 'supervisor-emp-1' };
    expect(canManageEmployeeKpi('SUPERVISOR', actor, target)).toBe(true);
  });

  it('SUPERVISOR cannot manage other team KPI', () => {
    const actor = { id: 'supervisor-emp-1' };
    const target = { id: 'emp-2', supervisorId: 'other-supervisor' };
    expect(canManageEmployeeKpi('SUPERVISOR', actor, target)).toBe(false);
  });

  it('SUPERVISOR cannot manage KPI when actor employee missing', () => {
    const target = { id: 'emp-2', supervisorId: 'supervisor-emp-1' };
    expect(canManageEmployeeKpi('SUPERVISOR', null, target)).toBe(false);
  });

  it('EMPLOYEE cannot manage any KPI', () => {
    const actor = { id: 'emp-1' };
    const target = { id: 'emp-1' };
    expect(canManageEmployeeKpi('EMPLOYEE', actor, target)).toBe(false);
  });

  it('EMPLOYEE can read own KPI', () => {
    const actor = { id: 'emp-1' };
    const target = { id: 'emp-1' };
    expect(canReadEmployeeKpi('EMPLOYEE', actor, target)).toBe(true);
  });

  it('EMPLOYEE cannot read other employee KPI', () => {
    const actor = { id: 'emp-1' };
    const target = { id: 'emp-2' };
    expect(canReadEmployeeKpi('EMPLOYEE', actor, target)).toBe(false);
  });

  it('SUPERVISOR can read team KPI', () => {
    const actor = { id: 'supervisor-emp-1' };
    const target = { id: 'emp-2', supervisorId: 'supervisor-emp-1' };
    expect(canReadEmployeeKpi('SUPERVISOR', actor, target)).toBe(true);
  });
});
