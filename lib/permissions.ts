export type UserRole = 'SUPERADMIN' | 'ADMIN_HR' | 'SUPERVISOR' | 'EMPLOYEE';

export const PERMISSIONS: Record<string, readonly UserRole[]> = {
  // User Management
  USER_CREATE: ['SUPERADMIN', 'ADMIN_HR'],
  USER_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  USER_UPDATE: ['SUPERADMIN', 'ADMIN_HR'],
  USER_DELETE: ['SUPERADMIN'],
  
  // Employee Management
  EMPLOYEE_CREATE: ['SUPERADMIN', 'ADMIN_HR'],
  EMPLOYEE_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  EMPLOYEE_UPDATE: ['SUPERADMIN', 'ADMIN_HR'],
  EMPLOYEE_DELETE: ['SUPERADMIN'],
  EMPLOYEE_READ_OWN: ['EMPLOYEE'],
  
  // Work Location Management
  LOCATION_CREATE: ['SUPERADMIN', 'ADMIN_HR'],
  LOCATION_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  LOCATION_UPDATE: ['SUPERADMIN', 'ADMIN_HR'],
  LOCATION_DELETE: ['SUPERADMIN'],
  
  // Shift Management
  SHIFT_CREATE: ['SUPERADMIN', 'ADMIN_HR'],
  SHIFT_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  SHIFT_UPDATE: ['SUPERADMIN', 'ADMIN_HR'],
  SHIFT_DELETE: ['SUPERADMIN'],
  
  // Attendance Management
  ATTENDANCE_CREATE: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN_HR', 'SUPERADMIN'],
  ATTENDANCE_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  ATTENDANCE_READ_OWN: ['EMPLOYEE'],
  ATTENDANCE_UPDATE: ['SUPERADMIN', 'ADMIN_HR'],
  ATTENDANCE_DELETE: ['SUPERADMIN'],
  ATTENDANCE_MANUAL_ADJUST: ['SUPERADMIN', 'ADMIN_HR'],
  
  // Leave Management
  LEAVE_CREATE: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN_HR', 'SUPERADMIN'],
  LEAVE_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  LEAVE_READ_OWN: ['EMPLOYEE'],
  LEAVE_APPROVE: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  LEAVE_REJECT: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  
  // KPI Management
  KPI_TEMPLATE_CREATE: ['SUPERADMIN', 'ADMIN_HR'],
  KPI_TEMPLATE_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  KPI_TEMPLATE_UPDATE: ['SUPERADMIN', 'ADMIN_HR'],
  KPI_TEMPLATE_DELETE: ['SUPERADMIN'],
  KPI_ASSIGN: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  KPI_INPUT: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  KPI_READ: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  KPI_READ_OWN: ['EMPLOYEE'],
  KPI_APPROVE: ['SUPERADMIN', 'ADMIN_HR'],
  
  // Reports
  REPORT_VIEW: ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'],
  REPORT_EXPORT: ['SUPERADMIN', 'ADMIN_HR'],
  
  // Dashboard
  DASHBOARD_SUPERADMIN: ['SUPERADMIN'],
  DASHBOARD_HR: ['ADMIN_HR'],
  DASHBOARD_SUPERVISOR: ['SUPERVISOR'],
  DASHBOARD_EMPLOYEE: ['EMPLOYEE'],
  
  // Audit Log
  AUDIT_READ: ['SUPERADMIN'],
  
  // Notifications
  NOTIFICATION_READ_OWN: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN_HR', 'SUPERADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ROLE_RANK: Record<UserRole, number> = {
  EMPLOYEE: 1,
  SUPERVISOR: 2,
  ADMIN_HR: 3,
  SUPERADMIN: 4,
};

export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'SUPERADMIN') {
    return true;
  }

  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

export function requirePermission(userRole: UserRole, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }
}

export function canAccessOwnData(userRole: UserRole, userId: string, targetUserId: string): boolean {
  // Superadmin and Admin HR can access all data
  const fullAccessRoles: readonly UserRole[] = ['SUPERADMIN', 'ADMIN_HR'];

  if (fullAccessRoles.includes(userRole)) {
    return true;
  }
  
  // Others can only access their own data
  return userId === targetUserId;
}

export function canAccessTeamData(
  userRole: UserRole,
  userId: string,
  targetUserId: string,
  supervisorId?: string
): boolean {
  // Superadmin and Admin HR can access all data
  const fullAccessRoles: readonly UserRole[] = ['SUPERADMIN', 'ADMIN_HR'];

  if (fullAccessRoles.includes(userRole)) {
    return true;
  }
  
  // Supervisor can access their team's data
  if (userRole === 'SUPERVISOR' && supervisorId === userId) {
    return true;
  }
  
  // Can access own data
  return userId === targetUserId;
}
