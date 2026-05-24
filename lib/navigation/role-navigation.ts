import type { UserRole } from '@/lib/permissions';
import { type FeatureFlagKey, isFeatureEnabled } from '@/lib/features/feature-flags';

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
  | 'leader-team'
  | 'leader-kpi-input'
  | 'leader-report'
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
  featureFlag?: FeatureFlagKey;
}

export interface NavigationItem extends Omit<NavigationPolicyItem, 'primaryFor'> {
  primary: boolean;
}

export const navigationPolicy: readonly NavigationPolicyItem[] = [
  { key: 'dashboard', name: 'Beranda', path: '/dashboard', primaryFor: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'self-service', name: 'ESS', path: '/dashboard/self-service', primaryFor: [], allowedRoles: ['LEADER', 'EMPLOYEE'] },
  { key: 'attendance', name: 'Absensi', path: '/dashboard/attendance', primaryFor: ['LEADER', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'locations', name: 'Cabang', path: '/dashboard/locations', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'attendance-exceptions', name: 'Approval', path: '/dashboard/attendance/exceptions', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'users', name: 'Pengguna', path: '/dashboard/users', primaryFor: ['SUPERADMIN'], allowedRoles: ['SUPERADMIN'] },
  { key: 'employees', name: 'Karyawan', path: '/dashboard/employees', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'shifts', name: 'Shift', path: '/dashboard/shifts', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'leave', name: 'Cuti', path: '/dashboard/leave', primaryFor: ['EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'kpi', name: 'KPI', path: '/dashboard/kpi', primaryFor: ['SUPERADMIN', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'leader-kpi-input', name: 'Input KPI', path: '/dashboard/leader/kpi-input', primaryFor: ['LEADER'], allowedRoles: ['LEADER'] },
  { key: 'leader-team', name: 'Tim', path: '/dashboard/leader/team', primaryFor: ['LEADER'], allowedRoles: ['LEADER'] },
  { key: 'leader-report', name: 'Laporan Tim', path: '/dashboard/leader/reports', primaryFor: [], allowedRoles: ['LEADER'] },
  { key: 'reports', name: 'Laporan', path: '/dashboard/reports', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'payroll', name: 'Payroll', path: '/dashboard/payroll', primaryFor: ['SUPERADMIN'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'overtime', name: 'Lembur', path: '/dashboard/overtime', primaryFor: [], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], featureFlag: 'overtime' },
  { key: 'documents', name: 'Dokumen', path: '/dashboard/documents', primaryFor: [], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], featureFlag: 'documents' },
  { key: 'notifications', name: 'Notifikasi', path: '/dashboard/notifications', primaryFor: [], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'audit', name: 'Audit', path: '/dashboard/audit', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'profile', name: 'Akun', path: '/dashboard/profile', primaryFor: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
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
    .filter((item) => !item.featureFlag || isFeatureEnabled(item.featureFlag))
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
