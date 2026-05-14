import { UserRole } from '@prisma/client';

export const PERMISSIONS: Record<string, readonly UserRole[]> = {
  // User Management
  USER_CREATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  USER_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  USER_UPDATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  USER_DELETE: [UserRole.SUPERADMIN],
  
  // Employee Management
  EMPLOYEE_CREATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  EMPLOYEE_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  EMPLOYEE_UPDATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  EMPLOYEE_DELETE: [UserRole.SUPERADMIN],
  EMPLOYEE_READ_OWN: [UserRole.EMPLOYEE],
  
  // Work Location Management
  LOCATION_CREATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  LOCATION_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  LOCATION_UPDATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  LOCATION_DELETE: [UserRole.SUPERADMIN],
  
  // Shift Management
  SHIFT_CREATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  SHIFT_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  SHIFT_UPDATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  SHIFT_DELETE: [UserRole.SUPERADMIN],
  
  // Attendance Management
  ATTENDANCE_CREATE: [UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.ADMIN_HR, UserRole.SUPERADMIN],
  ATTENDANCE_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  ATTENDANCE_READ_OWN: [UserRole.EMPLOYEE],
  ATTENDANCE_UPDATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  ATTENDANCE_DELETE: [UserRole.SUPERADMIN],
  ATTENDANCE_MANUAL_ADJUST: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  
  // Leave Management
  LEAVE_CREATE: [UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.ADMIN_HR, UserRole.SUPERADMIN],
  LEAVE_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  LEAVE_READ_OWN: [UserRole.EMPLOYEE],
  LEAVE_APPROVE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  LEAVE_REJECT: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  
  // KPI Management
  KPI_TEMPLATE_CREATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  KPI_TEMPLATE_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  KPI_TEMPLATE_UPDATE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  KPI_TEMPLATE_DELETE: [UserRole.SUPERADMIN],
  KPI_ASSIGN: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  KPI_INPUT: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  KPI_READ: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  KPI_READ_OWN: [UserRole.EMPLOYEE],
  KPI_APPROVE: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  
  // Reports
  REPORT_VIEW: [UserRole.SUPERADMIN, UserRole.ADMIN_HR, UserRole.SUPERVISOR],
  REPORT_EXPORT: [UserRole.SUPERADMIN, UserRole.ADMIN_HR],
  
  // Dashboard
  DASHBOARD_SUPERADMIN: [UserRole.SUPERADMIN],
  DASHBOARD_HR: [UserRole.ADMIN_HR],
  DASHBOARD_SUPERVISOR: [UserRole.SUPERVISOR],
  DASHBOARD_EMPLOYEE: [UserRole.EMPLOYEE],
  
  // Audit Log
  AUDIT_READ: [UserRole.SUPERADMIN],
  
  // Notifications
  NOTIFICATION_READ_OWN: [UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.ADMIN_HR, UserRole.SUPERADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.EMPLOYEE]: 1,
  [UserRole.SUPERVISOR]: 2,
  [UserRole.ADMIN_HR]: 3,
  [UserRole.SUPERADMIN]: 4,
};

export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === UserRole.SUPERADMIN) {
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
  const fullAccessRoles: readonly UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN_HR];

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
  const fullAccessRoles: readonly UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN_HR];

  if (fullAccessRoles.includes(userRole)) {
    return true;
  }
  
  // Supervisor can access their team's data
  if (userRole === UserRole.SUPERVISOR && supervisorId === userId) {
    return true;
  }
  
  // Can access own data
  return userId === targetUserId;
}
