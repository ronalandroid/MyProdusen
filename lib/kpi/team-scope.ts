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
  if (role === 'SUPERADMIN' || role === 'ADMIN_HR') {
    return true;
  }

  if (role !== 'SUPERVISOR' || !actorEmployee || !targetEmployee) {
    return false;
  }

  return targetEmployee.supervisorId === actorEmployee.id;
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
