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
  primary: boolean;
  allowedRoles: readonly UserRole[];
}

export const navigationPolicy: readonly NavigationPolicyItem[] = [
  { key: 'dashboard', name: 'Beranda', path: '/dashboard', primary: true, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'] },
  { key: 'self-service', name: 'ESS', path: '/dashboard/self-service', primary: true, allowedRoles: ['EMPLOYEE', 'SUPERVISOR'] },
  { key: 'attendance', name: 'Kehadiran', path: '/dashboard/attendance', primary: true, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'] },
  { key: 'attendance-exceptions', name: 'Exception', path: '/dashboard/attendance/exceptions', primary: false, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'] },
  { key: 'employees', name: 'Karyawan', path: '/dashboard/employees', primary: true, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'] },
  { key: 'locations', name: 'Lokasi Kerja', path: '/dashboard/locations', primary: false, allowedRoles: ['SUPERADMIN', 'ADMIN_HR'] },
  { key: 'shifts', name: 'Shift', path: '/dashboard/shifts', primary: false, allowedRoles: ['SUPERADMIN', 'ADMIN_HR'] },
  { key: 'leave', name: 'Cuti', path: '/dashboard/leave', primary: true, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'] },
  { key: 'kpi', name: 'KPI', path: '/dashboard/kpi', primary: true, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'] },
  { key: 'reports', name: 'Laporan', path: '/dashboard/reports', primary: false, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'] },
  { key: 'documents', name: 'Dokumen', path: '/dashboard/documents', primary: false, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'] },
  { key: 'notifications', name: 'Notifikasi', path: '/dashboard/notifications', primary: true, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'] },
  { key: 'audit', name: 'Audit', path: '/dashboard/audit', primary: false, allowedRoles: ['SUPERADMIN'] },
  { key: 'profile', name: 'Akun', path: '/dashboard/profile', primary: true, allowedRoles: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE'] },
];

export function getNavigationForRole(role: UserRole) {
  return navigationPolicy.filter((item) => item.allowedRoles.includes(role));
}

export function canAccessNavigationPath(role: UserRole, path: string) {
  return navigationPolicy.some((item) => path === item.path && item.allowedRoles.includes(role));
}
