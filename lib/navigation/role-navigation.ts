import type { UserRole } from '@/lib/permissions';
import { type FeatureFlagKey, isFeatureEnabled } from '@/lib/features/feature-flags';

export type NavigationItemKey =
  | 'dashboard'
  | 'self-service'
  | 'attendance'
  | 'attendance-exceptions'
  | 'attendance-schedules'
  | 'users'
  | 'employees'
  | 'locations'
  | 'shifts'
  | 'leave'
  | 'kpi'
  | 'kpi-template'
  | 'performance-assessment'
  | 'leader-team'
  | 'leader-kpi-input'
  | 'leader-report'
  | 'reports'
  | 'reports-pdf'
  | 'payroll'
  | 'overtime'
  | 'announcements'
  | 'documents'
  | 'notifications'
  | 'audit'
  | 'email-logs'
  | 'settings'
  | 'accounts'
  | 'profile';

export type NavigationGroupKey = 'utama' | 'operasional' | 'kinerja' | 'finansial' | 'lainnya';

/** Ordered, collapsible sidebar groups. Order here is the render order. */
export const navigationGroups: readonly { key: NavigationGroupKey; label: string }[] = [
  { key: 'utama', label: 'Utama' },
  { key: 'operasional', label: 'Operasional' },
  { key: 'kinerja', label: 'Kinerja' },
  { key: 'finansial', label: 'Finansial' },
  { key: 'lainnya', label: 'Lainnya' },
];

export interface NavigationPolicyItem {
  key: NavigationItemKey;
  name: string;
  path: string;
  group: NavigationGroupKey;
  primaryFor: readonly UserRole[];
  allowedRoles: readonly UserRole[];
  featureFlag?: FeatureFlagKey;
}

export interface NavigationItem extends Omit<NavigationPolicyItem, 'primaryFor'> {
  primary: boolean;
}

export interface NavigationGroup {
  key: NavigationGroupKey;
  label: string;
  items: readonly NavigationItem[];
}

// NOTE: array order drives the mobile primary nav (getPrimaryNavigationForRole)
// and within-group order; the `group` field drives desktop sidebar grouping.
// Keep this original order — reordering changes the mobile bottom-nav sequence.
export const navigationPolicy: readonly NavigationPolicyItem[] = [
  { key: 'dashboard', name: 'Beranda', path: '/dashboard', group: 'utama', primaryFor: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'self-service', name: 'ESS', path: '/dashboard/self-service', group: 'utama', primaryFor: [], allowedRoles: ['LEADER', 'EMPLOYEE'] },
  { key: 'attendance', name: 'Absensi', path: '/dashboard/attendance', group: 'utama', primaryFor: ['LEADER', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'locations', name: 'Cabang', path: '/dashboard/locations', group: 'operasional', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'attendance-exceptions', name: 'Approval', path: '/dashboard/attendance/exceptions', group: 'operasional', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'attendance-schedules', name: 'Jadwal', path: '/dashboard/attendance/schedules', group: 'operasional', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'users', name: 'Pengguna', path: '/dashboard/users', group: 'operasional', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'employees', name: 'Karyawan', path: '/dashboard/employees', group: 'operasional', primaryFor: ['SUPERADMIN'], allowedRoles: ['SUPERADMIN'] },
  { key: 'shifts', name: 'Shift', path: '/dashboard/shifts', group: 'operasional', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'leave', name: 'Cuti', path: '/dashboard/leave', group: 'utama', primaryFor: ['EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'EMPLOYEE'] },
  { key: 'kpi', name: 'KPI', path: '/dashboard/kpi', group: 'kinerja', primaryFor: ['SUPERADMIN', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'leader-kpi-input', name: 'Input KPI', path: '/dashboard/leader/kpi-input', group: 'kinerja', primaryFor: ['LEADER'], allowedRoles: ['LEADER'] },
  { key: 'leader-team', name: 'Tim', path: '/dashboard/leader/team', group: 'operasional', primaryFor: ['LEADER'], allowedRoles: ['LEADER'] },
  { key: 'leader-report', name: 'Laporan Tim', path: '/dashboard/leader/reports', group: 'kinerja', primaryFor: [], allowedRoles: ['LEADER'] },
  { key: 'reports', name: 'Laporan', path: '/dashboard/reports', group: 'finansial', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'payroll', name: 'Payroll', path: '/dashboard/payroll', group: 'finansial', primaryFor: ['SUPERADMIN'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'overtime', name: 'Lembur', path: '/dashboard/overtime', group: 'utama', primaryFor: [], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], featureFlag: 'overtime' },
  { key: 'documents', name: 'Dokumen', path: '/dashboard/documents', group: 'lainnya', primaryFor: [], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], featureFlag: 'documents' },
  { key: 'notifications', name: 'Notifikasi', path: '/dashboard/notifications', group: 'lainnya', primaryFor: [], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'kpi-template', name: 'Template KPI', path: '/dashboard/kpi-template', group: 'kinerja', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'performance-assessment', name: 'Penilaian', path: '/dashboard/performance/assessment', group: 'kinerja', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'announcements', name: 'Pengumuman', path: '/dashboard/announcements', group: 'lainnya', primaryFor: [], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
  { key: 'audit', name: 'Audit', path: '/dashboard/audit', group: 'lainnya', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'email-logs', name: 'Log Email', path: '/dashboard/email-logs', group: 'lainnya', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'settings', name: 'Kebijakan', path: '/dashboard/settings', group: 'lainnya', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'accounts', name: 'Akun & Peran', path: '/dashboard/accounts', group: 'lainnya', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'profile', name: 'Akun', path: '/dashboard/profile', group: 'lainnya', primaryFor: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'], allowedRoles: ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] },
];

// Route-access-only entries (not rendered in the sidebar), so no group needed.
const sensitiveRoutePolicy: readonly Omit<NavigationPolicyItem, 'group'>[] = [
  { key: 'accounts', name: 'Pengguna', path: '/dashboard/accounts', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'kpi-template', name: 'KPI Templates', path: '/dashboard/kpi/template', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'kpi-template', name: 'KPI Templates', path: '/dashboard/kpi/templates', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'kpi-template', name: 'KPI Templates', path: '/dashboard/kpi-template', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
  { key: 'performance-assessment', name: 'Penilaian Perilaku', path: '/dashboard/performance/assessment', primaryFor: [], allowedRoles: ['SUPERADMIN'] },
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

/**
 * Role-filtered navigation arranged into ordered, collapsible groups. Empty
 * groups are dropped. Drives the desktop sidebar so each role sees a small,
 * scannable set of groups instead of one long flat list.
 */
export function getGroupedNavigationForRole(role: UserRole | string): readonly NavigationGroup[] {
  const items = getNavigationForRole(role);
  return navigationGroups
    .map((group) => ({
      key: group.key,
      label: group.label,
      items: items.filter((item) => item.group === group.key),
    }))
    .filter((group) => group.items.length > 0);
}

export function canAccessNavigationPath(role: UserRole | string, path: string): boolean {
  const policies = [...navigationPolicy, ...sensitiveRoutePolicy].sort((left, right) => right.path.length - left.path.length);
  const matchedPolicy = policies.find((item) => path === item.path || (item.path !== '/dashboard' && path.startsWith(`${item.path}/`)));
  return Boolean(matchedPolicy?.allowedRoles.includes(role as UserRole));
}
