import type { UserRole } from '@/lib/permissions';

export interface KpiScopeEmployee {
  id: string;
  supervisorId?: string | null;
}

export function canManageEmployeeKpi(
  role: UserRole,
  actorEmployee: KpiScopeEmployee | null | undefined,
  targetEmployee: KpiScopeEmployee | null | undefined,
) {
  if (role === 'SUPERADMIN') {
    return true;
  }

  return false;
}

export function canReadEmployeeKpi(
  role: UserRole,
  actorEmployee: KpiScopeEmployee | null | undefined,
  targetEmployee: KpiScopeEmployee | null | undefined,
) {
  if (canManageEmployeeKpi(role, actorEmployee, targetEmployee)) {
    return true;
  }

  return role === 'EMPLOYEE' && Boolean(actorEmployee && targetEmployee && actorEmployee.id === targetEmployee.id);
}
