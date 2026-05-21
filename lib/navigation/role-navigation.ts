import type { UserRole } from '@/lib/permissions';

export type NavigationItemKey =
  | 'dashboard'
  | 'self-service'
  | 'attendance'
  | 'attendance-exceptions'
  | 'users'
  | 'employees'
  | 'locations'
  | 'shifts'
  | 'leave'
  | 'kpi'
  | 'reports'
  | 'reports-pdf'
  | 'payroll'
  | 'overtime'
  | 'documents'
  | 'notifications'
  | 'audit'
  | 'profile';

export interface NavigationPolicyItem {
  key: NavigationItemKey;
  name: string;
  path: string;
  primaryFor: readonly UserRole[];
  allowedRoles: readonly UserRole[];
}

export interface NavigationItem extends Omit<NavigationPolicyItem, 'primaryFor'> {
  primary: boolean;
}

export const navigationPolicy: readonly NavigationPolicyItem[] = [
  { key: 'dashboard', name: 'Beranda', path: '/dashboard', primaryFor: ['SUPERADMIN', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'self-service', name: 'ESS', path: '/dashboard/self-service', primaryFor: [], allowedRoles: ['EMPLOYEE'] },
  { key: 'attendance', name: 'Absensi', path: '/dashboard/attendance', primaryFor: ['EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'locations', name: 'Cabang', path: '/dashboard/locations', primaryFor: ['SUPERADMIN'], allowedRoles: ['SUPERADMIN'] },
  { key: 'attendance-exceptions', name: 'Approval', path: '/dashboard/attendance/exceptions', primaryFor: ['SUPERADMIN'], allowedRoles: ['SUPERADMIN'] },
  { key: 'users', name: 'Pengguna', path: '/dashboard/users', primaryFor: ['SUPERADMIN'], allowedRoles: ['SUPERADMIN'] },
  { key: 'employees', name: 'Karyawan', path: '/dashboard/employees', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'shifts', name: 'Shift', path: '/dashboard/shifts', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'leave', name: 'Cuti', path: '/dashboard/leave', primaryFor: ['EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'kpi', name: 'KPI', path: '/dashboard/kpi', primaryFor: ['EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'reports', name: 'Laporan', path: '/dashboard/reports', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'payroll', name: 'Gaji', path: '/dashboard/payroll', primaryFor: [], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'overtime', name: 'Lembur', path: '/dashboard/overtime', primaryFor: [], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'documents', name: 'Dokumen', path: '/dashboard/documents', primaryFor: [], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'notifications', name: 'Notifikasi', path: '/dashboard/notifications', primaryFor: [], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'audit', name: 'Audit', path: '/dashboard/audit', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'profile', name: 'Akun', path: '/dashboard/profile', primaryFor: ['SUPERADMIN', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
];

const sensitiveRoutePolicy: readonly NavigationPolicyItem[] = [
  { key: 'users', name: 'Pengguna', path: '/dashboard/accounts', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'kpi', name: 'KPI Templates', path: '/dashboard/kpi/template', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'kpi', name: 'KPI Templates', path: '/dashboard/kpi/templates', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'kpi', name: 'KPI Templates', path: '/dashboard/kpi-template', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'reports-pdf', name: 'PDF Reports', path: '/dashboard/reports/pdf', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
];

const MAX_PRIMARY_SLOTS = 5;

export function getNavigationForRole(role: UserRole | string): readonly NavigationItem[] {
  return navigationPolicy
    .filter((item) => item.allowedRoles.includes(role as UserRole))
    .map((item) => ({ ...item, primary: item.primaryFor.includes(role as UserRole) }));
}

export function getPrimaryNavigationForRole(role: UserRole | string): readonly NavigationItem[] {
  return getNavigationForRole(role).filter((item) => item.primary).slice(0, MAX_PRIMARY_SLOTS);
}

export function canAccessNavigationPath(role: UserRole | string, path: string): boolean {
  const policies = [...navigationPolicy, ...sensitiveRoutePolicy].sort((left, right) => right.path.length - left.path.length);
  const matchedPolicy = policies.find((item) => path === item.path || path.startsWith(`${item.path}/`));
  return Boolean(matchedPolicy?.allowedRoles.includes(role as UserRole));
}
