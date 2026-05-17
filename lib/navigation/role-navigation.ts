import type { UserRole } from '@/lib/permissions';

export type NavigationItemKey =
  | 'dashboard'
  | 'self-service'
  | 'attendance'
  | 'attendance-exceptions'
  | 'employees'
  | 'locations'
  | 'shifts'
  | 'leave'
  | 'kpi'
  | 'reports'
  | 'documents'
  | 'notifications'
  | 'audit'
  | 'profile';

export interface NavigationPolicyItem {
  key: NavigationItemKey;
  name: string;
  path: string;
  /**
   * Roles for which this item appears in the bottom-bar (primary) navigation.
   * The remaining allowed roles still see the item in the secondary menu —
   * routes are not hidden, only re-prioritised to fit the 5-slot mobile bar.
   */
  primaryFor: readonly UserRole[];
  allowedRoles: readonly UserRole[];
}

export interface NavigationItem extends Omit<NavigationPolicyItem, 'primaryFor'> {
  /** True when the item should render in the bottom bar for the active role. */
  primary: boolean;
}

export const navigationPolicy: readonly NavigationPolicyItem[] = [
  {
    key: 'dashboard',
    name: 'Beranda',
    path: '/dashboard',
    primaryFor: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    key: 'self-service',
    name: 'ESS',
    path: '/dashboard/self-service',
    primaryFor: [],
    allowedRoles: ['EMPLOYEE', 'SUPERVISOR'],
  },
  {
    key: 'attendance',
    name: 'Kehadiran',
    path: '/dashboard/attendance',
    primaryFor: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN_HR'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    key: 'attendance-exceptions',
    name: 'Approval',
    path: '/dashboard/attendance/exceptions',
    primaryFor: ['SUPERADMIN'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  },
  {
    key: 'employees',
    name: 'Karyawan',
    path: '/dashboard/employees',
    primaryFor: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  },
  {
    key: 'locations',
    name: 'Lokasi Kerja',
    path: '/dashboard/locations',
    primaryFor: [],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR'],
  },
  {
    key: 'shifts',
    name: 'Shift',
    path: '/dashboard/shifts',
    primaryFor: [],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR'],
  },
  {
    key: 'leave',
    name: 'Cuti',
    path: '/dashboard/leave',
    primaryFor: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN_HR'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    key: 'kpi',
    name: 'KPI',
    path: '/dashboard/kpi',
    primaryFor: ['EMPLOYEE'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    key: 'reports',
    name: 'Laporan',
    path: '/dashboard/reports',
    primaryFor: ['SUPERADMIN'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  },
  {
    key: 'documents',
    name: 'Dokumen',
    path: '/dashboard/documents',
    primaryFor: [],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    key: 'notifications',
    name: 'Notifikasi',
    path: '/dashboard/notifications',
    primaryFor: [],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
  },
  {
    key: 'audit',
    name: 'Audit',
    path: '/dashboard/audit',
    primaryFor: [],
    allowedRoles: ['SUPERADMIN'],
  },
  {
    key: 'profile',
    name: 'Akun',
    path: '/dashboard/profile',
    primaryFor: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
    allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'],
  },
];

const MAX_PRIMARY_SLOTS = 5;

export function getNavigationForRole(role: UserRole): readonly NavigationItem[] {
  return navigationPolicy
    .filter((item) => item.allowedRoles.includes(role))
    .map((item) => ({
      key: item.key,
      name: item.name,
      path: item.path,
      allowedRoles: item.allowedRoles,
      primary: item.primaryFor.includes(role),
    }));
}

export function getPrimaryNavigationForRole(role: UserRole): readonly NavigationItem[] {
  return getNavigationForRole(role)
    .filter((item) => item.primary)
    .slice(0, MAX_PRIMARY_SLOTS);
}

export function canAccessNavigationPath(role: UserRole, path: string): boolean {
  return navigationPolicy.some((item) => path === item.path && item.allowedRoles.includes(role));
}
