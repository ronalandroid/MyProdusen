import { pgTable, text, timestamp, boolean, integer, real, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('UserRole', ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE']);
export const employeeStatusEnum = pgEnum('EmployeeStatus', ['ACTIVE', 'INACTIVE', 'SUSPENDED']);
export const attendanceStatusEnum = pgEnum('AttendanceStatus', ['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'SICK', 'PERMISSION']);
export const leaveStatusEnum = pgEnum('LeaveStatus', ['PENDING', 'APPROVED', 'REJECTED']);
export const leaveTypeEnum = pgEnum('LeaveType', ['LEAVE', 'SICK', 'PERMISSION']);
export const kpiScoringTypeEnum = pgEnum('KpiScoringType', ['HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'BOOLEAN']);

// User table
export const users = pgTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').default('EMPLOYEE').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('User_email_idx').on(table.email),
  usernameIdx: index('User_username_idx').on(table.username),
}));

// Employee table
export const employees = pgTable('Employee', {
  id: text('id').primaryKey(),
  nip: text('nip').notNull().unique(),
  userId: text('userId').notNull().unique(),
  fullName: text('fullName').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  joinDate: timestamp('joinDate', { mode: 'date' }).defaultNow().notNull(),
  division: text('division'),
  position: text('position'),
  supervisorId: text('supervisorId'),
  status: employeeStatusEnum('status').default('ACTIVE').notNull(),
  profilePhoto: text('profilePhoto'),
  emergencyContact: text('emergencyContact'),
  defaultShiftId: text('defaultShiftId'),
  defaultLocationId: text('defaultLocationId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  nipIdx: index('Employee_nip_idx').on(table.nip),
  userIdIdx: index('Employee_userId_idx').on(table.userId),
  supervisorIdIdx: index('Employee_supervisorId_idx').on(table.supervisorId),
}));

// Work Location table
export const workLocations = pgTable('WorkLocation', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radius: integer('radius').default(100).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('WorkLocation_isActive_idx').on(table.isActive),
}));

// Shift table
export const shifts = pgTable('Shift', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startTime: text('startTime').notNull(),
  endTime: text('endTime').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

// Attendance table
export const attendances = pgTable('Attendance', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  workLocationId: text('workLocationId').notNull(),
  shiftId: text('shiftId'),
  checkInTime: timestamp('checkInTime', { mode: 'date' }).notNull(),
  checkInLatitude: real('checkInLatitude').notNull(),
  checkInLongitude: real('checkInLongitude').notNull(),
  checkInAccuracy: real('checkInAccuracy'),
  checkInDistance: real('checkInDistance'),
  checkInSelfie: text('checkInSelfie').notNull(),
  checkInDeviceInfo: text('checkInDeviceInfo'),
  checkInIp: text('checkInIp'),
  checkInUserAgent: text('checkInUserAgent'),
  checkOutTime: timestamp('checkOutTime', { mode: 'date' }),
  checkOutLatitude: real('checkOutLatitude'),
  checkOutLongitude: real('checkOutLongitude'),
  checkOutAccuracy: real('checkOutAccuracy'),
  checkOutDistance: real('checkOutDistance'),
  checkOutSelfie: text('checkOutSelfie'),
  checkOutDeviceInfo: text('checkOutDeviceInfo'),
  checkOutIp: text('checkOutIp'),
  checkOutUserAgent: text('checkOutUserAgent'),
  status: attendanceStatusEnum('status').default('PRESENT').notNull(),
  lateMinutes: integer('lateMinutes').default(0).notNull(),
  earlyLeaveMinutes: integer('earlyLeaveMinutes').default(0).notNull(),
  totalWorkMinutes: integer('totalWorkMinutes').default(0).notNull(),
  isManualAdjustment: boolean('isManualAdjustment').default(false).notNull(),
  adjustmentReason: text('adjustmentReason'),
  adjustedBy: text('adjustedBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('Attendance_employeeId_idx').on(table.employeeId),
  workLocationIdIdx: index('Attendance_workLocationId_idx').on(table.workLocationId),
  checkInTimeIdx: index('Attendance_checkInTime_idx').on(table.checkInTime),
  statusIdx: index('Attendance_status_idx').on(table.status),
}));

// Leave Request table
export const leaveRequests = pgTable('LeaveRequest', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  type: leaveTypeEnum('type').notNull(),
  startDate: timestamp('startDate', { mode: 'date' }).notNull(),
  endDate: timestamp('endDate', { mode: 'date' }).notNull(),
  reason: text('reason').notNull(),
  status: leaveStatusEnum('status').default('PENDING').notNull(),
  approvedBy: text('approvedBy'),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
  rejectedBy: text('rejectedBy'),
  rejectedAt: timestamp('rejectedAt', { mode: 'date' }),
  rejectionReason: text('rejectionReason'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('LeaveRequest_employeeId_idx').on(table.employeeId),
  statusIdx: index('LeaveRequest_status_idx').on(table.status),
  startDateIdx: index('LeaveRequest_startDate_idx').on(table.startDate),
}));

// KPI Template table
export const kpiTemplates = pgTable('KpiTemplate', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

// KPI Item table
export const kpiItems = pgTable('KpiItem', {
  id: text('id').primaryKey(),
  templateId: text('templateId').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  weight: real('weight').default(1.0).notNull(),
  scoringType: kpiScoringTypeEnum('scoringType').default('HIGHER_IS_BETTER').notNull(),
  targetValue: real('targetValue'),
  minValue: real('minValue'),
  maxValue: real('maxValue'),
  unit: text('unit'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  templateIdIdx: index('KpiItem_templateId_idx').on(table.templateId),
}));

// KPI Assignment table
export const kpiAssignments = pgTable('KpiAssignment', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  templateId: text('templateId').notNull(),
  period: text('period').notNull(),
  assignedBy: text('assignedBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('KpiAssignment_employeeId_idx').on(table.employeeId),
  periodIdx: index('KpiAssignment_period_idx').on(table.period),
  uniqueAssignment: uniqueIndex('KpiAssignment_employeeId_templateId_period_key').on(table.employeeId, table.templateId, table.period),
}));

// KPI Result table
export const kpiResults = pgTable('KpiResult', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  itemId: text('itemId').notNull(),
  period: text('period').notNull(),
  actualValue: real('actualValue').notNull(),
  score: real('score').notNull(),
  isApproved: boolean('isApproved').default(false).notNull(),
  approvedBy: text('approvedBy'),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('KpiResult_employeeId_idx').on(table.employeeId),
  periodIdx: index('KpiResult_period_idx').on(table.period),
  uniqueResult: uniqueIndex('KpiResult_employeeId_itemId_period_key').on(table.employeeId, table.itemId, table.period),
}));

// Audit Log table
export const auditLogs = pgTable('AuditLog', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entityId'),
  oldValue: text('oldValue'),
  newValue: text('newValue'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('AuditLog_userId_idx').on(table.userId),
  entityIdx: index('AuditLog_entity_idx').on(table.entity),
  createdAtIdx: index('AuditLog_createdAt_idx').on(table.createdAt),
}));

// Notification table
export const notifications = pgTable('Notification', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  isRead: boolean('isRead').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('Notification_userId_idx').on(table.userId),
  isReadIdx: index('Notification_isRead_idx').on(table.isRead),
  createdAtIdx: index('Notification_createdAt_idx').on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  supervisor: one(employees, {
    fields: [employees.supervisorId],
    references: [employees.id],
    relationName: 'supervisor',
  }),
  subordinates: many(employees, {
    relationName: 'supervisor',
  }),
  defaultShift: one(shifts, {
    fields: [employees.defaultShiftId],
    references: [shifts.id],
  }),
  defaultLocation: one(workLocations, {
    fields: [employees.defaultLocationId],
    references: [workLocations.id],
  }),
  attendances: many(attendances),
  leaveRequests: many(leaveRequests),
  kpiAssignments: many(kpiAssignments),
  kpiResults: many(kpiResults),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  employee: one(employees, {
    fields: [attendances.employeeId],
    references: [employees.id],
  }),
  workLocation: one(workLocations, {
    fields: [attendances.workLocationId],
    references: [workLocations.id],
  }),
  shift: one(shifts, {
    fields: [attendances.shiftId],
    references: [shifts.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
}));

export const kpiTemplatesRelations = relations(kpiTemplates, ({ many }) => ({
  items: many(kpiItems),
  assignments: many(kpiAssignments),
}));

export const kpiItemsRelations = relations(kpiItems, ({ one, many }) => ({
  template: one(kpiTemplates, {
    fields: [kpiItems.templateId],
    references: [kpiTemplates.id],
  }),
  results: many(kpiResults),
}));

export const kpiAssignmentsRelations = relations(kpiAssignments, ({ one }) => ({
  employee: one(employees, {
    fields: [kpiAssignments.employeeId],
    references: [employees.id],
  }),
  template: one(kpiTemplates, {
    fields: [kpiAssignments.templateId],
    references: [kpiTemplates.id],
  }),
}));

export const kpiResultsRelations = relations(kpiResults, ({ one }) => ({
  employee: one(employees, {
    fields: [kpiResults.employeeId],
    references: [employees.id],
  }),
  item: one(kpiItems, {
    fields: [kpiResults.itemId],
    references: [kpiItems.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
