import type { UserRole } from '@/lib/permissions';

export type PayrollAction = 'read' | 'mutate' | 'approve' | 'pay' | 'export' | 'readOwn';

export function isPayrollModuleEnabled() {
  return process.env.PAYROLL_MODULE_ENABLED === 'true';
}

export function isPayrollMutationEnabled() {
  return process.env.PAYROLL_MUTATION_ENABLED === 'true';
}

export function canAccessPayroll(role: UserRole, action: PayrollAction) {
  if (!isPayrollModuleEnabled()) return false;

  if (action === 'readOwn') return role === 'EMPLOYEE';
  if (role === 'SUPERADMIN') return true;
  if (false) return action === 'read' || action === 'mutate' || action === 'export';
  return false;
}

export function assertPayrollAccess(role: UserRole, action: PayrollAction) {
  if (!canAccessPayroll(role, action)) {
    throw new Error('PAYROLL_FORBIDDEN');
  }

  if (action !== 'read' && action !== 'readOwn' && action !== 'export' && !isPayrollMutationEnabled()) {
    throw new Error('PAYROLL_MUTATION_DISABLED');
  }
}

export function payrollAccessErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === 'PAYROLL_FORBIDDEN') {
    return 'Anda tidak memiliki akses payroll';
  }

  if (error instanceof Error && error.message === 'PAYROLL_MUTATION_DISABLED') {
    return 'Mutasi payroll sedang dinonaktifkan';
  }

  return undefined;
}
