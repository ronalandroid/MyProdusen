import { pgTable, text, timestamp, boolean, integer, real, pgEnum, uniqueIndex, index, date, time, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('UserRole', ['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'LEADER', 'EMPLOYEE']);
export const kpiProductionEntryStatusEnum = pgEnum('KpiProductionEntryStatus', ['DRAFT', 'SUBMITTED']);
export const employeeStatusEnum = pgEnum('EmployeeStatus', ['ACTIVE', 'INACTIVE', 'SUSPENDED']);
export const attendanceStatusEnum = pgEnum('AttendanceStatus', ['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'SICK', 'PERMISSION']);
export const leaveStatusEnum = pgEnum('LeaveStatus', ['PENDING', 'APPROVED', 'REJECTED']);
export const leaveTypeEnum = pgEnum('LeaveType', ['LEAVE', 'SICK', 'PERMISSION']);
export const kpiScoringTypeEnum = pgEnum('KpiScoringType', ['HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'BOOLEAN']);
export const attendanceExceptionTypeEnum = pgEnum('AttendanceExceptionType', ['OUTSIDE_GEOFENCE', 'BAD_GPS_ACCURACY', 'MISSING_SELFIE', 'MANUAL_ADJUSTMENT', 'LATE_CORRECTION', 'MISSING_CHECKOUT']);
export const attendanceExceptionStatusEnum = pgEnum('AttendanceExceptionStatus', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const leaveBalanceTransactionTypeEnum = pgEnum('LeaveBalanceTransactionType', ['ENTITLEMENT', 'CARRY_FORWARD', 'REQUEST_HOLD', 'REQUEST_APPROVED', 'REQUEST_REJECTED_RELEASE', 'MANUAL_ADJUSTMENT', 'EXPIRY']);
export const policyScopeTypeEnum = pgEnum('PolicyScopeType', ['COMPANY', 'TEAM', 'EMPLOYEE']);
export const workCalendarDayTypeEnum = pgEnum('WorkCalendarDayType', ['WORKDAY', 'HOLIDAY', 'COMPANY_HOLIDAY', 'SPECIAL_WORKDAY']);
export const payrollCalculationSourceTypeEnum = pgEnum('PayrollCalculationSourceType', ['ATTENDANCE', 'KPI', 'HOLIDAY', 'MANUAL', 'ADJUSTMENT']);

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
  profileCompletedAt: timestamp('profileCompletedAt', { mode: 'date' }),
  defaultShiftId: text('defaultShiftId'),
  defaultLocationId: text('defaultLocationId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  nipIdx: index('Employee_nip_idx').on(table.nip),
  userIdIdx: index('Employee_userId_idx').on(table.userId),
  divisionIdx: index('Employee_division_idx').on(table.division),
  statusIdx: index('Employee_status_idx').on(table.status),
  supervisorIdIdx: index('Employee_supervisorId_idx').on(table.supervisorId),
  defaultShiftIdIdx: index('Employee_defaultShiftId_idx').on(table.defaultShiftId),
  defaultLocationIdIdx: index('Employee_defaultLocationId_idx').on(table.defaultLocationId),
}));

// Work Location table
export const workLocations = pgTable('WorkLocation', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radius: integer('radius').default(150).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('WorkLocation_isActive_idx').on(table.isActive),
  nameIdx: index('WorkLocation_name_idx').on(table.name),
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
}, (table) => ({
  isActiveIdx: index('Shift_isActive_idx').on(table.isActive),
  nameIdx: index('Shift_name_idx').on(table.name),
}));

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
  checkInSelfieUrl: text('check_in_selfie_url'),
  checkInSelfiePath: text('check_in_selfie_path'),
  checkInSelfieUploadedAt: timestamp('check_in_selfie_uploaded_at', { mode: 'date' }),
  checkInSelfieSizeBytes: integer('check_in_selfie_size_bytes'),
  checkInSelfieMimeType: text('check_in_selfie_mime_type'),
  checkInDeviceInfo: text('checkInDeviceInfo'),
  checkInIp: text('checkInIp'),
  checkInUserAgent: text('checkInUserAgent'),
  checkInGeoStatus: text('check_in_geo_status'),
  checkOutTime: timestamp('checkOutTime', { mode: 'date' }),
  checkOutLatitude: real('checkOutLatitude'),
  checkOutLongitude: real('checkOutLongitude'),
  checkOutAccuracy: real('checkOutAccuracy'),
  checkOutDistance: real('checkOutDistance'),
  checkOutSelfie: text('checkOutSelfie'),
  checkOutSelfieUrl: text('check_out_selfie_url'),
  checkOutSelfiePath: text('check_out_selfie_path'),
  checkOutSelfieUploadedAt: timestamp('check_out_selfie_uploaded_at', { mode: 'date' }),
  checkOutSelfieSizeBytes: integer('check_out_selfie_size_bytes'),
  checkOutSelfieMimeType: text('check_out_selfie_mime_type'),
  checkOutDeviceInfo: text('checkOutDeviceInfo'),
  checkOutIp: text('checkOutIp'),
  checkOutUserAgent: text('checkOutUserAgent'),
  checkOutGeoStatus: text('check_out_geo_status'),
  geoValidationMetadata: jsonb('geo_validation_metadata').$type<Record<string, unknown>>(),
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
  employeeIdCheckInTimeIdx: index('Attendance_employeeId_checkInTime_idx').on(table.employeeId, table.checkInTime),
  workLocationIdIdx: index('Attendance_workLocationId_idx').on(table.workLocationId),
  shiftIdIdx: index('Attendance_shiftId_idx').on(table.shiftId),
  checkInTimeIdx: index('Attendance_checkInTime_idx').on(table.checkInTime),
  statusIdx: index('Attendance_status_idx').on(table.status),
  statusCheckInTimeIdx: index('Attendance_status_checkInTime_idx').on(table.status, table.checkInTime),
  checkInGeoStatusIdx: index('Attendance_check_in_geo_status_idx').on(table.checkInGeoStatus),
  checkOutGeoStatusIdx: index('Attendance_check_out_geo_status_idx').on(table.checkOutGeoStatus),
  employeeCheckInDateUnique: uniqueIndex('Attendance_employeeId_checkInDate_key').on(
    table.employeeId,
    sql`DATE(${table.checkInTime})`
  ),
}));

// Attendance Exception table
export const attendanceExceptions = pgTable('AttendanceException', {
  id: text('id').primaryKey(),
  attendanceId: text('attendanceId'),
  employeeId: text('employeeId').notNull(),
  type: attendanceExceptionTypeEnum('type').notNull(),
  status: attendanceExceptionStatusEnum('status').default('PENDING').notNull(),
  reason: text('reason').notNull(),
  requestedBy: text('requestedBy').notNull(),
  reviewedBy: text('reviewedBy'),
  reviewNote: text('reviewNote'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewedAt', { mode: 'date' }),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  attendanceIdIdx: index('AttendanceException_attendanceId_idx').on(table.attendanceId),
  employeeIdIdx: index('AttendanceException_employeeId_idx').on(table.employeeId),
  statusIdx: index('AttendanceException_status_idx').on(table.status),
  statusCreatedAtIdx: index('AttendanceException_status_createdAt_idx').on(table.status, table.createdAt),
  typeIdx: index('AttendanceException_type_idx').on(table.type),
  createdAtIdx: index('AttendanceException_createdAt_idx').on(table.createdAt),
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
  statusCreatedAtIdx: index('LeaveRequest_status_createdAt_idx').on(table.status, table.createdAt),
  employeeStatusDateIdx: index('LeaveRequest_employeeId_status_startDate_endDate_idx').on(table.employeeId, table.status, table.startDate, table.endDate),
  startDateIdx: index('LeaveRequest_startDate_idx').on(table.startDate),
}));

// Leave Balance Ledger table
export const leaveBalanceLedger = pgTable('LeaveBalanceLedger', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  leaveRequestId: text('leaveRequestId'),
  transactionType: leaveBalanceTransactionTypeEnum('transactionType').notNull(),
  amount: real('amount').notNull(),
  balanceYear: integer('balanceYear').notNull(),
  reason: text('reason').notNull(),
  createdBy: text('createdBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('LeaveBalanceLedger_employeeId_idx').on(table.employeeId),
  leaveRequestIdIdx: index('LeaveBalanceLedger_leaveRequestId_idx').on(table.leaveRequestId),
  balanceYearIdx: index('LeaveBalanceLedger_balanceYear_idx').on(table.balanceYear),
}));

// KPI Template table
export const kpiTemplates = pgTable('KpiTemplate', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('KpiTemplate_isActive_idx').on(table.isActive),
}));

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
  templatePeriodIdx: index('KpiAssignment_templateId_period_idx').on(table.templateId, table.period),
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
  employeePeriodIdx: index('KpiResult_employeeId_period_idx').on(table.employeeId, table.period),
  approvalPeriodIdx: index('KpiResult_isApproved_period_idx').on(table.isApproved, table.period),
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
  actionIdx: index('AuditLog_action_idx').on(table.action),
  entityCreatedAtIdx: index('AuditLog_entity_createdAt_idx').on(table.entity, table.createdAt),
  userCreatedAtIdx: index('AuditLog_userId_createdAt_idx').on(table.userId, table.createdAt),
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
  userReadCreatedAtIdx: index('Notification_userId_isRead_createdAt_idx').on(table.userId, table.isRead, table.createdAt),
  userCreatedAtIdx: index('Notification_userId_createdAt_idx').on(table.userId, table.createdAt),
  isReadIdx: index('Notification_isRead_idx').on(table.isRead),
  createdAtIdx: index('Notification_createdAt_idx').on(table.createdAt),
}));

// Email Log table
export const emailLogs = pgTable('EmailLog', {
  id: text('id').primaryKey(),
  template: text('template').notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  provider: text('provider').default('resend').notNull(),
  providerMessageId: text('providerMessageId'),
  status: text('status').notNull(),
  errorMessage: text('errorMessage'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  templateCreatedAtIdx: index('EmailLog_template_createdAt_idx').on(table.template, table.createdAt),
  recipientCreatedAtIdx: index('EmailLog_recipient_createdAt_idx').on(table.recipient, table.createdAt),
  statusCreatedAtIdx: index('EmailLog_status_createdAt_idx').on(table.status, table.createdAt),
  providerMessageIdIdx: index('EmailLog_providerMessageId_idx').on(table.providerMessageId),
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
  attendanceExceptions: many(attendanceExceptions),
  leaveRequests: many(leaveRequests),
  leaveBalanceLedger: many(leaveBalanceLedger),
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

export const attendanceExceptionsRelations = relations(attendanceExceptions, ({ one }) => ({
  attendance: one(attendances, {
    fields: [attendanceExceptions.attendanceId],
    references: [attendances.id],
  }),
  employee: one(employees, {
    fields: [attendanceExceptions.employeeId],
    references: [employees.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
}));

export const leaveBalanceLedgerRelations = relations(leaveBalanceLedger, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveBalanceLedger.employeeId],
    references: [employees.id],
  }),
  leaveRequest: one(leaveRequests, {
    fields: [leaveBalanceLedger.leaveRequestId],
    references: [leaveRequests.id],
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

// ============================================
// PAYROLL MODULE
// ============================================

export const payrollComponentTypeEnum = pgEnum('PayrollComponentType', ['ALLOWANCE', 'DEDUCTION', 'BENEFIT']);
export const payrollRunStatusEnum = pgEnum('PayrollRunStatus', ['DRAFT', 'CALCULATED', 'APPROVED', 'PAID']);
export const payrollPeriodStatusEnum = pgEnum('PayrollPeriodStatus', ['OPEN', 'PREPARING', 'LOCKED', 'CLOSED']);

// Payroll Period Lock
export const payrollPeriods = pgTable('PayrollPeriod', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: timestamp('startDate', { mode: 'date' }).notNull(),
  endDate: timestamp('endDate', { mode: 'date' }).notNull(),
  status: payrollPeriodStatusEnum('status').default('OPEN').notNull(),
  lockedBy: text('lockedBy'),
  lockedAt: timestamp('lockedAt', { mode: 'date' }),
  lockedReason: text('lockedReason'),
  createdBy: text('createdBy').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('PayrollPeriod_status_idx').on(table.status),
  startDateIdx: index('PayrollPeriod_startDate_idx').on(table.startDate),
  endDateIdx: index('PayrollPeriod_endDate_idx').on(table.endDate),
  createdByIdx: index('PayrollPeriod_createdBy_idx').on(table.createdBy),
  dateRangeUnique: uniqueIndex('PayrollPeriod_date_range_unique').on(table.startDate, table.endDate),
}));


// Payroll Structure (Salary Templates)
export const payrollStructures = pgTable('PayrollStructure', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  baseSalary: real('baseSalary').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('PayrollStructure_isActive_idx').on(table.isActive),
}));

// Payroll Components (Allowances, Deductions, Benefits)
export const payrollComponents = pgTable('PayrollComponent', {
  id: text('id').primaryKey(),
  structureId: text('structureId').notNull(),
  name: text('name').notNull(),
  type: payrollComponentTypeEnum('type').notNull(),
  amount: real('amount').notNull(),
  isPercentage: boolean('isPercentage').default(false).notNull(),
  isTaxable: boolean('isTaxable').default(true).notNull(),
  description: text('description'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  structureIdIdx: index('PayrollComponent_structureId_idx').on(table.structureId),
}));

// Employee Payroll Assignment
export const employeePayrolls = pgTable('EmployeePayroll', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  structureId: text('structureId').notNull(),
  baseSalary: real('baseSalary').notNull(),
  effectiveDate: timestamp('effectiveDate', { mode: 'date' }).notNull(),
  endDate: timestamp('endDate', { mode: 'date' }),
  bankName: text('bankName'),
  bankAccountNumber: text('bankAccountNumber'),
  bankAccountName: text('bankAccountName'),
  taxId: text('taxId'), // NPWP
  bpjsKesehatanNumber: text('bpjsKesehatanNumber'),
  bpjsKetenagakerjaanNumber: text('bpjsKetenagakerjaanNumber'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('EmployeePayroll_employeeId_idx').on(table.employeeId),
  structureIdIdx: index('EmployeePayroll_structureId_idx').on(table.structureId),
  effectiveDateIdx: index('EmployeePayroll_effectiveDate_idx').on(table.effectiveDate),
  uniqueEmployeeActive: uniqueIndex('EmployeePayroll_employeeId_active_key').on(table.employeeId).where(sql`${table.endDate} IS NULL`),
}));

// Payroll Run (Monthly Payroll Execution)
export const payrollRuns = pgTable('PayrollRun', {
  id: text('id').primaryKey(),
  period: text('period').notNull(), // YYYY-MM format
  periodStart: timestamp('periodStart', { mode: 'date' }).notNull(),
  periodEnd: timestamp('periodEnd', { mode: 'date' }).notNull(),
  status: payrollRunStatusEnum('status').default('DRAFT').notNull(),
  totalEmployees: integer('totalEmployees').default(0).notNull(),
  totalGrossPay: real('totalGrossPay').default(0).notNull(),
  totalDeductions: real('totalDeductions').default(0).notNull(),
  totalNetPay: real('totalNetPay').default(0).notNull(),
  calculatedBy: text('calculatedBy'),
  calculatedAt: timestamp('calculatedAt', { mode: 'date' }),
  approvedBy: text('approvedBy'),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
  paidAt: timestamp('paidAt', { mode: 'date' }),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  periodIdx: index('PayrollRun_period_idx').on(table.period),
  statusIdx: index('PayrollRun_status_idx').on(table.status),
  statusPeriodIdx: index('PayrollRun_status_period_idx').on(table.status, table.period),
  uniquePeriod: uniqueIndex('PayrollRun_period_key').on(table.period),
}));

// Payroll Items (Individual Employee Payroll)
export const payrollItems = pgTable('PayrollItem', {
  id: text('id').primaryKey(),
  runId: text('runId').notNull(),
  employeeId: text('employeeId').notNull(),
  baseSalary: real('baseSalary').notNull(),
  totalAllowances: real('totalAllowances').default(0).notNull(),
  totalDeductions: real('totalDeductions').default(0).notNull(),
  overtimePay: real('overtimePay').default(0).notNull(),
  attendanceDeduction: real('attendanceDeduction').default(0).notNull(),
  taxAmount: real('taxAmount').default(0).notNull(),
  bpjsKesehatanEmployee: real('bpjsKesehatanEmployee').default(0).notNull(),
  bpjsKesehatanCompany: real('bpjsKesehatanCompany').default(0).notNull(),
  bpjsKetenagakerjaanEmployee: real('bpjsKetenagakerjaanEmployee').default(0).notNull(),
  bpjsKetenagakerjaanCompany: real('bpjsKetenagakerjaanCompany').default(0).notNull(),
  grossPay: real('grossPay').notNull(),
  netPay: real('netPay').notNull(),
  bonusPay: real('bonusPay').default(0).notNull(),
  workDays: integer('workDays').default(0).notNull(),
  absentDays: integer('absentDays').default(0).notNull(),
  lateDays: integer('lateDays').default(0).notNull(),
  overtimeHours: real('overtimeHours').default(0).notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  runIdIdx: index('PayrollItem_runId_idx').on(table.runId),
  employeeIdIdx: index('PayrollItem_employeeId_idx').on(table.employeeId),
  employeeRunIdx: index('PayrollItem_employeeId_runId_idx').on(table.employeeId, table.runId),
  uniqueRunEmployee: uniqueIndex('PayrollItem_runId_employeeId_key').on(table.runId, table.employeeId),
}));

// Payslip (Generated Payslip PDF/Document)
export const payslips = pgTable('Payslip', {
  id: text('id').primaryKey(),
  itemId: text('itemId').notNull().unique(),
  employeeId: text('employeeId').notNull(),
  period: text('period').notNull(),
  fileUrl: text('fileUrl'),
  isDownloaded: boolean('isDownloaded').default(false).notNull(),
  downloadedAt: timestamp('downloadedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('Payslip_employeeId_idx').on(table.employeeId),
  periodIdx: index('Payslip_period_idx').on(table.period),
}));

// ============================================
// OVERTIME MODULE
// ============================================

export const overtimeStatusEnum = pgEnum('OvertimeStatus', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

// Overtime Rate Configuration
export const overtimeRates = pgTable('OvertimeRate', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  multiplier: real('multiplier').notNull(), // 1.5x, 2x, 3x
  description: text('description'),
  isWeekday: boolean('isWeekday').default(true).notNull(),
  isWeekend: boolean('isWeekend').default(false).notNull(),
  isHoliday: boolean('isHoliday').default(false).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

export const teams = pgTable('Team', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug'),
  type: text('type'),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  createdBy: text('createdBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('Team_name_idx').on(table.name),
  activeIdx: index('Team_active_idx').on(table.active),
}));

export const leaderAssignments = pgTable('LeaderAssignment', {
  id: text('id').primaryKey(),
  leaderUserId: text('leaderUserId').notNull(),
  teamId: text('teamId').notNull(),
  active: boolean('active').default(true).notNull(),
  createdBy: text('createdBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  leaderIdx: index('LeaderAssignment_leaderUserId_idx').on(table.leaderUserId),
  teamIdx: index('LeaderAssignment_teamId_idx').on(table.teamId),
  activeIdx: index('LeaderAssignment_active_idx').on(table.active),
}));

export const employeeTeamAssignments = pgTable('EmployeeTeamAssignment', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  teamId: text('teamId').notNull(),
  positionId: text('positionId'),
  assignedBy: text('assignedBy'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index('EmployeeTeamAssignment_employeeId_idx').on(table.employeeId),
  teamIdx: index('EmployeeTeamAssignment_teamId_idx').on(table.teamId),
  activeIdx: index('EmployeeTeamAssignment_active_idx').on(table.active),
}));

export const positions = pgTable('Position', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teamId: text('teamId'),
  roleType: text('roleType'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('Position_name_idx').on(table.name),
  teamIdx: index('Position_teamId_idx').on(table.teamId),
  activeIdx: index('Position_active_idx').on(table.active),
}));

export const kpiProductionEntries = pgTable('KpiProductionEntry', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  teamId: text('teamId').notNull(),
  leaderUserId: text('leaderUserId').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  metricType: text('metricType').notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').default('pcs').notNull(),
  note: text('note'),
  status: kpiProductionEntryStatusEnum('status').default('SUBMITTED').notNull(),
  createdBy: text('createdBy').notNull(),
  updatedBy: text('updatedBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('KpiProductionEntry_date_idx').on(table.date),
  employeeIdx: index('KpiProductionEntry_employeeId_idx').on(table.employeeId),
  teamIdx: index('KpiProductionEntry_teamId_idx').on(table.teamId),
  leaderIdx: index('KpiProductionEntry_leaderUserId_idx').on(table.leaderUserId),
  metricTypeIdx: index('KpiProductionEntry_metricType_idx').on(table.metricType),
  createdAtIdx: index('KpiProductionEntry_createdAt_idx').on(table.createdAt),
  uniqueDailyMetric: uniqueIndex('KpiProductionEntry_employee_team_date_metric_unique').on(table.employeeId, table.teamId, table.date, table.metricType),
}));

// Overtime Request
export const overtimeRequests = pgTable('OvertimeRequest', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  overtimeDate: timestamp('overtimeDate', { mode: 'date' }).notNull(),
  startTime: text('startTime').notNull(),
  endTime: text('endTime').notNull(),
  durationHours: real('durationHours').notNull(),
  rateId: text('rateId').notNull(),
  reason: text('reason').notNull(),
  status: overtimeStatusEnum('status').default('PENDING').notNull(),
  approvedBy: text('approvedBy'),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
  rejectedReason: text('rejectedReason'),
  calculatedPay: real('calculatedPay').default(0).notNull(),
  isPaid: boolean('isPaid').default(false).notNull(),
  paidInPayrollRunId: text('paidInPayrollRunId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('OvertimeRequest_employeeId_idx').on(table.employeeId),
  statusIdx: index('OvertimeRequest_status_idx').on(table.status),
  overtimeDateIdx: index('OvertimeRequest_overtimeDate_idx').on(table.overtimeDate),
}));

// ============================================
// REIMBURSEMENT MODULE
// ============================================

export const expenseStatusEnum = pgEnum('ExpenseStatus', ['PENDING', 'APPROVED', 'REJECTED', 'PAID']);

// Expense Category
export const expenseCategories = pgTable('ExpenseCategory', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  maxAmount: real('maxAmount'), // Maximum allowed per claim
  requiresReceipt: boolean('requiresReceipt').default(true).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

// Expense Claim
export const expenseClaims = pgTable('ExpenseClaim', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  claimNumber: text('claimNumber').notNull().unique(),
  claimDate: timestamp('claimDate', { mode: 'date' }).notNull(),
  totalAmount: real('totalAmount').notNull(),
  status: expenseStatusEnum('status').default('PENDING').notNull(),
  description: text('description'),
  approvedBy: text('approvedBy'),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
  rejectedReason: text('rejectedReason'),
  isPaid: boolean('isPaid').default(false).notNull(),
  paidAt: timestamp('paidAt', { mode: 'date' }),
  paidInPayrollRunId: text('paidInPayrollRunId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('ExpenseClaim_employeeId_idx').on(table.employeeId),
  statusIdx: index('ExpenseClaim_status_idx').on(table.status),
  claimDateIdx: index('ExpenseClaim_claimDate_idx').on(table.claimDate),
}));

// Expense Item (Line items in a claim)
export const expenseItems = pgTable('ExpenseItem', {
  id: text('id').primaryKey(),
  claimId: text('claimId').notNull(),
  categoryId: text('categoryId').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  expenseDate: timestamp('expenseDate', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  claimIdIdx: index('ExpenseItem_claimId_idx').on(table.claimId),
}));

// Expense Receipt (Uploaded receipts)
export const expenseReceipts = pgTable('ExpenseReceipt', {
  id: text('id').primaryKey(),
  itemId: text('itemId').notNull(),
  fileUrl: text('fileUrl').notNull(),
  fileName: text('fileName').notNull(),
  fileSize: integer('fileSize').notNull(),
  mimeType: text('mimeType').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  itemIdIdx: index('ExpenseReceipt_itemId_idx').on(table.itemId),
}));

// ============================================
// RELATIONS FOR NEW MODULES
// ============================================

export const payrollStructuresRelations = relations(payrollStructures, ({ many }) => ({
  components: many(payrollComponents),
  employeePayrolls: many(employeePayrolls),
}));

export const payrollComponentsRelations = relations(payrollComponents, ({ one }) => ({
  structure: one(payrollStructures, {
    fields: [payrollComponents.structureId],
    references: [payrollStructures.id],
  }),
}));

export const employeePayrollsRelations = relations(employeePayrolls, ({ one }) => ({
  employee: one(employees, {
    fields: [employeePayrolls.employeeId],
    references: [employees.id],
  }),
  structure: one(payrollStructures, {
    fields: [employeePayrolls.structureId],
    references: [payrollStructures.id],
  }),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ many }) => ({
  items: many(payrollItems),
}));


export const payrollPeriodsRelations = relations(payrollPeriods, ({ one }) => ({
  creator: one(users, {
    fields: [payrollPeriods.createdBy],
    references: [users.id],
  }),
  locker: one(users, {
    fields: [payrollPeriods.lockedBy],
    references: [users.id],
  }),
}));
export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  run: one(payrollRuns, {
    fields: [payrollItems.runId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payrollItems.employeeId],
    references: [employees.id],
  }),
  payslip: one(payslips, {
    fields: [payrollItems.id],
    references: [payslips.itemId],
  }),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  item: one(payrollItems, {
    fields: [payslips.itemId],
    references: [payrollItems.id],
  }),
  employee: one(employees, {
    fields: [payslips.employeeId],
    references: [employees.id],
  }),
}));

export const overtimeRatesRelations = relations(overtimeRates, ({ many }) => ({
  requests: many(overtimeRequests),
}));

export const overtimeRequestsRelations = relations(overtimeRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [overtimeRequests.employeeId],
    references: [employees.id],
  }),
  rate: one(overtimeRates, {
    fields: [overtimeRequests.rateId],
    references: [overtimeRates.id],
  }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  items: many(expenseItems),
}));

export const expenseClaimsRelations = relations(expenseClaims, ({ one, many }) => ({
  employee: one(employees, {
    fields: [expenseClaims.employeeId],
    references: [employees.id],
  }),
  items: many(expenseItems),
}));

export const expenseItemsRelations = relations(expenseItems, ({ one, many }) => ({
  claim: one(expenseClaims, {
    fields: [expenseItems.claimId],
    references: [expenseClaims.id],
  }),
  category: one(expenseCategories, {
    fields: [expenseItems.categoryId],
    references: [expenseCategories.id],
  }),
  receipts: many(expenseReceipts),
}));

export const expenseReceiptsRelations = relations(expenseReceipts, ({ one }) => ({
  item: one(expenseItems, {
    fields: [expenseReceipts.itemId],
    references: [expenseItems.id],
  }),
}));

// ============================================
// ANNOUNCEMENT SYSTEM
// ============================================

export const announcementCategoryEnum = pgEnum('AnnouncementCategory', ['GENERAL', 'POLICY', 'EVENT', 'EMERGENCY']);
export const announcementPriorityEnum = pgEnum('AnnouncementPriority', ['NORMAL', 'IMPORTANT', 'URGENT']);

export const announcements = pgTable('Announcement', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: announcementCategoryEnum('category').default('GENERAL').notNull(),
  priority: announcementPriorityEnum('priority').default('NORMAL').notNull(),
  targetAudience: text('targetAudience').default('ALL').notNull(), // ALL, DEPARTMENT:name, EMPLOYEE:id
  isPinned: boolean('isPinned').default(false).notNull(),
  isArchived: boolean('isArchived').default(false).notNull(),
  publishedBy: text('publishedBy').notNull(),
  publishedAt: timestamp('publishedAt', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }),
  imageUrl: text('imageUrl'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  publishedAtIdx: index('Announcement_publishedAt_idx').on(table.publishedAt),
  categoryIdx: index('Announcement_category_idx').on(table.category),
  isPinnedIdx: index('Announcement_isPinned_idx').on(table.isPinned),
}));

export const announcementReads = pgTable('AnnouncementRead', {
  id: text('id').primaryKey(),
  announcementId: text('announcementId').notNull(),
  userId: text('userId').notNull(),
  readAt: timestamp('readAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  announcementIdIdx: index('AnnouncementRead_announcementId_idx').on(table.announcementId),
  userIdIdx: index('AnnouncementRead_userId_idx').on(table.userId),
  uniqueRead: uniqueIndex('AnnouncementRead_announcementId_userId_key').on(table.announcementId, table.userId),
}));

export const announcementComments = pgTable('AnnouncementComment', {
  id: text('id').primaryKey(),
  announcementId: text('announcementId').notNull(),
  userId: text('userId').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  announcementIdIdx: index('AnnouncementComment_announcementId_idx').on(table.announcementId),
  createdAtIdx: index('AnnouncementComment_createdAt_idx').on(table.createdAt),
}));

// ============================================
// CALENDAR & HOLIDAYS
// ============================================

export const holidayTypeEnum = pgEnum('HolidayType', ['PUBLIC', 'COMPANY', 'RELIGIOUS']);

export const holidays = pgTable('Holiday', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  type: holidayTypeEnum('type').default('PUBLIC').notNull(),
  description: text('description'),
  isRecurring: boolean('isRecurring').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('Holiday_date_idx').on(table.date),
}));

export const companyEvents = pgTable('CompanyEvent', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startDate: timestamp('startDate', { mode: 'date' }).notNull(),
  endDate: timestamp('endDate', { mode: 'date' }).notNull(),
  location: text('location'),
  organizer: text('organizer').notNull(),
  isAllDay: boolean('isAllDay').default(false).notNull(),
  color: text('color').default('#2563eb'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  startDateIdx: index('CompanyEvent_startDate_idx').on(table.startDate),
}));

// ============================================
// PERFORMANCE REVIEW
// ============================================

export const reviewCycleStatusEnum = pgEnum('ReviewCycleStatus', ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);
export const reviewStatusEnum = pgEnum('ReviewStatus', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED']);

export const reviewCycles = pgTable('ReviewCycle', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  startDate: timestamp('startDate', { mode: 'date' }).notNull(),
  endDate: timestamp('endDate', { mode: 'date' }).notNull(),
  status: reviewCycleStatusEnum('status').default('DRAFT').notNull(),
  createdBy: text('createdBy').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('ReviewCycle_status_idx').on(table.status),
  startDateIdx: index('ReviewCycle_startDate_idx').on(table.startDate),
}));

export const performanceReviews = pgTable('PerformanceReview', {
  id: text('id').primaryKey(),
  cycleId: text('cycleId').notNull(),
  employeeId: text('employeeId').notNull(),
  reviewerId: text('reviewerId').notNull(),
  status: reviewStatusEnum('status').default('PENDING').notNull(),
  selfAssessment: text('selfAssessment'),
  managerAssessment: text('managerAssessment'),
  overallRating: real('overallRating'),
  strengths: text('strengths'),
  areasForImprovement: text('areasForImprovement'),
  goals: text('goals'),
  comments: text('comments'),
  submittedAt: timestamp('submittedAt', { mode: 'date' }),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
  approvedBy: text('approvedBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  cycleIdIdx: index('PerformanceReview_cycleId_idx').on(table.cycleId),
  employeeIdIdx: index('PerformanceReview_employeeId_idx').on(table.employeeId),
  statusIdx: index('PerformanceReview_status_idx').on(table.status),
  uniqueReview: uniqueIndex('PerformanceReview_cycleId_employeeId_key').on(table.cycleId, table.employeeId),
}));

export const reviewGoals = pgTable('ReviewGoal', {
  id: text('id').primaryKey(),
  reviewId: text('reviewId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: timestamp('targetDate', { mode: 'date' }),
  progress: integer('progress').default(0).notNull(),
  isCompleted: boolean('isCompleted').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  reviewIdIdx: index('ReviewGoal_reviewId_idx').on(table.reviewId),
}));

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

export const documentCategoryEnum = pgEnum('DocumentCategory', ['CONTRACT', 'CERTIFICATE', 'ID', 'EDUCATION', 'MEDICAL', 'OTHER']);
export const documentStatusEnum = pgEnum('DocumentStatus', ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']);

export const employeeDocuments = pgTable('EmployeeDocument', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  category: documentCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  fileUrl: text('fileUrl').notNull(),
  fileName: text('fileName').notNull(),
  fileSize: integer('fileSize').notNull(),
  mimeType: text('mimeType').notNull(),
  version: integer('version').default(1).notNull(),
  status: documentStatusEnum('status').default('PENDING').notNull(),
  expiryDate: timestamp('expiryDate', { mode: 'date' }),
  uploadedBy: text('uploadedBy').notNull(),
  approvedBy: text('approvedBy'),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index('EmployeeDocument_employeeId_idx').on(table.employeeId),
  categoryIdx: index('EmployeeDocument_category_idx').on(table.category),
  statusIdx: index('EmployeeDocument_status_idx').on(table.status),
  expiryDateIdx: index('EmployeeDocument_expiryDate_idx').on(table.expiryDate),
}));

// ============================================
// COMPANY SETTINGS
// ============================================

export const companySettings = pgTable('CompanySetting', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedBy: text('updatedBy'),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('CompanySetting_key_idx').on(table.key),
}));

// ============================================
// RELATIONS FOR NEW MODULES
// ============================================

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  publisher: one(users, {
    fields: [announcements.publishedBy],
    references: [users.id],
  }),
  reads: many(announcementReads),
  comments: many(announcementComments),
}));

export const announcementReadsRelations = relations(announcementReads, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementReads.announcementId],
    references: [announcements.id],
  }),
  user: one(users, {
    fields: [announcementReads.userId],
    references: [users.id],
  }),
}));

export const announcementCommentsRelations = relations(announcementComments, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementComments.announcementId],
    references: [announcements.id],
  }),
  user: one(users, {
    fields: [announcementComments.userId],
    references: [users.id],
  }),
}));

export const reviewCyclesRelations = relations(reviewCycles, ({ many }) => ({
  reviews: many(performanceReviews),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({ one, many }) => ({
  cycle: one(reviewCycles, {
    fields: [performanceReviews.cycleId],
    references: [reviewCycles.id],
  }),
  employee: one(employees, {
    fields: [performanceReviews.employeeId],
    references: [employees.id],
  }),
  reviewer: one(users, {
    fields: [performanceReviews.reviewerId],
    references: [users.id],
  }),
  goals: many(reviewGoals),
}));

export const reviewGoalsRelations = relations(reviewGoals, ({ one }) => ({
  review: one(performanceReviews, {
    fields: [reviewGoals.reviewId],
    references: [performanceReviews.id],
  }),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
  uploader: one(users, {
    fields: [employeeDocuments.uploadedBy],
    references: [users.id],
  }),
}));

// KPI and Payroll target rules
export const kpiMetrics = pgTable('KpiMetric', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  unit: text('unit').default('pcs').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('KpiMetric_active_idx').on(table.active),
}));

export const kpiTargets = pgTable('KpiTarget', {
  id: text('id').primaryKey(),
  metricId: text('metricId').notNull(),
  scopeType: text('scopeType').notNull(), // COMPANY / TEAM / POSITION / EMPLOYEE
  scopeId: text('scopeId'),
  periodType: text('periodType').notNull(), // DAILY / WEEKLY / MONTHLY
  targetQuantity: real('targetQuantity').notNull(),
  active: boolean('active').default(true).notNull(),
  effectiveFrom: timestamp('effectiveFrom', { mode: 'date' }),
  effectiveTo: timestamp('effectiveTo', { mode: 'date' }),
  createdBy: text('createdBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('KpiTarget_active_idx').on(table.active),
  metricIdIdx: index('KpiTarget_metricId_idx').on(table.metricId),
}));

export const payrollRules = pgTable('PayrollRule', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId'),
  teamId: text('teamId'),
  divisionId: text('divisionId'),
  periodType: text('periodType').notNull(), // WEEKLY / MONTHLY
  baseSalary: real('baseSalary').notNull(),
  targetMetricId: text('targetMetricId'),
  targetQuantity: real('targetQuantity'),
  bonusType: text('bonusType').default('PER_EXTRA_UNIT').notNull(), // PER_EXTRA_UNIT / FIXED / PERCENTAGE
  bonusAmountPerUnit: real('bonusAmountPerUnit'),
  attendancePolicyId: text('attendancePolicyId'),
  holidayMultiplierEnabled: boolean('holidayMultiplierEnabled').default(true).notNull(),
  realtimeCalculationEnabled: boolean('realtimeCalculationEnabled').default(true).notNull(),
  active: boolean('active').default(true).notNull(),
  effectiveFrom: timestamp('effectiveFrom', { mode: 'date' }),
  effectiveTo: timestamp('effectiveTo', { mode: 'date' }),
  createdBy: text('createdBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('PayrollRule_active_idx').on(table.active),
  employeeIdIdx: index('PayrollRule_employeeId_idx').on(table.employeeId),
  teamIdIdx: index('PayrollRule_teamId_idx').on(table.teamId),
  divisionIdIdx: index('PayrollRule_divisionId_idx').on(table.divisionId),
  attendancePolicyIdIdx: index('PayrollRule_attendancePolicyId_idx').on(table.attendancePolicyId),
}));

export const attendancePolicies = pgTable('AttendancePolicy', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  active: boolean('active').default(true).notNull(),
  appliesScopeType: policyScopeTypeEnum('appliesScopeType').default('COMPANY').notNull(),
  appliesScopeId: text('appliesScopeId'),
  graceMinutes: integer('graceMinutes').default(0).notNull(),
  lateTier1Min: integer('lateTier1Min').default(1).notNull(),
  lateTier1Max: integer('lateTier1Max').default(15).notNull(),
  lateTier1Deduction: real('lateTier1Deduction').default(5000).notNull(),
  lateTier2Min: integer('lateTier2Min').default(16).notNull(),
  lateTier2Max: integer('lateTier2Max').default(30).notNull(),
  lateTier2Deduction: real('lateTier2Deduction').default(10000).notNull(),
  halfDayAfterMinutes: integer('halfDayAfterMinutes').default(30).notNull(),
  halfDayPayFactor: real('halfDayPayFactor').default(0.5).notNull(),
  geofenceRadiusMeters: integer('geofenceRadiusMeters').default(150).notNull(),
  payrollSyncEnabled: boolean('payrollSyncEnabled').default(true).notNull(),
  createdBy: text('createdBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('AttendancePolicy_active_idx').on(table.active),
  scopeIdx: index('AttendancePolicy_scope_idx').on(table.appliesScopeType, table.appliesScopeId),
}));

export const attendanceDailySummaries = pgTable('AttendanceDailySummary', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  attendanceId: text('attendanceId'),
  workDate: date('workDate').notNull(),
  shiftStartAt: timestamp('shiftStartAt', { mode: 'date' }),
  clockInAt: timestamp('clockInAt', { mode: 'date' }),
  clockOutAt: timestamp('clockOutAt', { mode: 'date' }),
  lateMinutes: integer('lateMinutes').default(0).notNull(),
  lateDeduction: real('lateDeduction').default(0).notNull(),
  isHalfDay: boolean('isHalfDay').default(false).notNull(),
  geofenceDistanceMeters: real('geofenceDistanceMeters'),
  gpsAccuracyMeters: real('gpsAccuracyMeters'),
  selfieRequired: boolean('selfieRequired').default(true).notNull(),
  selfieVerified: boolean('selfieVerified').default(false).notNull(),
  payrollImpactStatus: text('payrollImpactStatus').default('NO_IMPACT').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeWorkDateIdx: uniqueIndex('AttendanceDailySummary_employee_workDate_idx').on(table.employeeId, table.workDate),
  attendanceIdIdx: index('AttendanceDailySummary_attendanceId_idx').on(table.attendanceId),
  payrollImpactStatusIdx: index('AttendanceDailySummary_payrollImpactStatus_idx').on(table.payrollImpactStatus),
}));

export const workCalendarDays = pgTable('WorkCalendarDay', {
  id: text('id').primaryKey(),
  date: date('date').notNull(),
  name: text('name').notNull(),
  type: workCalendarDayTypeEnum('type').default('WORKDAY').notNull(),
  isPaidHoliday: boolean('isPaidHoliday').default(false).notNull(),
  payMultiplier: real('payMultiplier').default(1).notNull(),
  createdBy: text('createdBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  dateIdx: uniqueIndex('WorkCalendarDay_date_idx').on(table.date),
  typeIdx: index('WorkCalendarDay_type_idx').on(table.type),
}));

export const payrollCalculationHistory = pgTable('PayrollCalculationHistory', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  payrollPeriodId: text('payrollPeriodId'),
  workDate: date('workDate'),
  sourceType: payrollCalculationSourceTypeEnum('sourceType').notNull(),
  sourceId: text('sourceId'),
  description: text('description').notNull(),
  amount: real('amount').default(0).notNull(),
  calculationSnapshot: jsonb('calculationSnapshot').$type<Record<string, unknown>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeWorkDateIdx: index('PayrollCalculationHistory_employee_workDate_idx').on(table.employeeId, table.workDate),
  sourceIdx: index('PayrollCalculationHistory_source_idx').on(table.sourceType, table.sourceId),
  payrollPeriodIdIdx: index('PayrollCalculationHistory_payrollPeriodId_idx').on(table.payrollPeriodId),
}));

export const performancePeriods = pgTable('PerformancePeriod', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: date('startDate').notNull(),
  endDate: date('endDate').notNull(),
  status: text('status').default('OPEN').notNull(),
  createdBy: text('createdBy'),
  closedBy: text('closedBy'),
  closedAt: timestamp('closedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('PerformancePeriod_status_idx').on(table.status),
  dateIdx: index('PerformancePeriod_date_idx').on(table.startDate, table.endDate),
}));

export const performanceScoreSnapshots = pgTable('PerformanceScoreSnapshot', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  periodId: text('periodId'),
  month: text('month'),
  scoreDate: date('scoreDate').notNull(),
  attendanceScore: real('attendanceScore').default(100).notNull(),
  kpiScore: real('kpiScore').default(100).notNull(),
  leaderScore: real('leaderScore').default(100).notNull(),
  totalScore: real('totalScore').default(100).notNull(),
  tier: text('tier').default('Platinum').notNull(),
  explanation: text('explanation').notNull(),
  sourceBreakdown: jsonb('sourceBreakdown').$type<Record<string, unknown>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeDateIdx: uniqueIndex('PerformanceScoreSnapshot_employee_date_idx').on(table.employeeId, table.scoreDate),
  periodIdx: index('PerformanceScoreSnapshot_period_idx').on(table.periodId),
  totalScoreIdx: index('PerformanceScoreSnapshot_totalScore_idx').on(table.totalScore),
}));

export const performanceScoreSummaries = pgTable('PerformanceScoreSummary', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull().unique(),
  periodId: text('periodId'),
  currentScore: real('currentScore').default(100).notNull(),
  attendanceScore: real('attendanceScore').default(100).notNull(),
  kpiScore: real('kpiScore').default(100).notNull(),
  leaderScore: real('leaderScore').default(100).notNull(),
  tier: text('tier').default('Platinum').notNull(),
  maintainedPerfectDays: integer('maintainedPerfectDays').default(0).notNull(),
  projectedRaisePercent: real('projectedRaisePercent').default(0).notNull(),
  lastCalculatedAt: timestamp('lastCalculatedAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index('PerformanceScoreSummary_employee_idx').on(table.employeeId),
  scoreIdx: index('PerformanceScoreSummary_score_idx').on(table.currentScore),
  tierIdx: index('PerformanceScoreSummary_tier_idx').on(table.tier),
}));

export const leaderScoreEntries = pgTable('LeaderScoreEntry', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  leaderEmployeeId: text('leaderEmployeeId').notNull(),
  score: integer('score').notNull(),
  notes: text('notes').notNull(),
  scoreDate: date('scoreDate').notNull(),
  periodId: text('periodId'),
  periodType: text('periodType').default('MONTHLY').notNull(),
  scoreType: text('scoreType').default('CULTURE_DISCIPLINE').notNull(),
  scorerRole: text('scorerRole'),
  subcriteria: jsonb('subcriteria').$type<Record<string, number>>(),
  isFinal: boolean('isFinal').default(false).notNull(),
  reason: text('reason'),
  createdBy: text('createdBy').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  employeeDateIdx: index('LeaderScoreEntry_employee_date_idx').on(table.employeeId, table.scoreDate),
  leaderIdx: index('LeaderScoreEntry_leader_idx').on(table.leaderEmployeeId),
}));

export const leaderScoreAnomalies = pgTable('LeaderScoreAnomaly', {
  id: text('id').primaryKey(),
  leaderScoreEntryId: text('leaderScoreEntryId').notNull(),
  employeeId: text('employeeId').notNull(),
  type: text('type').notNull(),
  status: text('status').default('PENDING').notNull(),
  reviewedBy: text('reviewedBy'),
  reviewNote: text('reviewNote'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewedAt', { mode: 'date' }),
}, (table) => ({
  statusIdx: index('LeaderScoreAnomaly_status_idx').on(table.status),
  employeeIdx: index('LeaderScoreAnomaly_employee_idx').on(table.employeeId),
}));

export const badgeDefinitions = pgTable('BadgeDefinition', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('BadgeDefinition_code_idx').on(table.code),
}));

export const employeeBadges = pgTable('EmployeeBadge', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  badgeDefinitionId: text('badgeDefinitionId').notNull(),
  awardedAt: timestamp('awardedAt', { mode: 'date' }).defaultNow().notNull(),
  sourceSnapshotId: text('sourceSnapshotId'),
}, (table) => ({
  employeeBadgeIdx: uniqueIndex('EmployeeBadge_employee_badge_idx').on(table.employeeId, table.badgeDefinitionId),
  employeeIdx: index('EmployeeBadge_employee_idx').on(table.employeeId),
}));

export const companyThemeSettings = pgTable('CompanyThemeSetting', {
  id: text('id').primaryKey(),
  primaryColor: text('primaryColor').default('#f6c343').notNull(),
  secondaryColor: text('secondaryColor').default('#111827').notNull(),
  accentColor: text('accentColor').default('#dc2626').notNull(),
  themeMode: text('themeMode').default('default').notNull(),
  safeTokens: jsonb('safeTokens').$type<Record<string, string>>(),
  updatedBy: text('updatedBy'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

export const themeChangeAudits = pgTable('ThemeChangeAudit', {
  id: text('id').primaryKey(),
  themeSettingId: text('themeSettingId').notNull(),
  changedBy: text('changedBy').notNull(),
  oldValue: jsonb('oldValue').$type<Record<string, unknown>>(),
  newValue: jsonb('newValue').$type<Record<string, unknown>>(),
  reason: text('reason').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  themeIdx: index('ThemeChangeAudit_theme_idx').on(table.themeSettingId),
  changedByIdx: index('ThemeChangeAudit_changedBy_idx').on(table.changedBy),
}));

// Relations
export const kpiMetricsRelations = relations(kpiMetrics, ({ many }) => ({
  targets: many(kpiTargets),
}));

export const kpiTargetsRelations = relations(kpiTargets, ({ one }) => ({
  metric: one(kpiMetrics, {
    fields: [kpiTargets.metricId],
    references: [kpiMetrics.id],
  }),
}));

export const payrollRulesRelations = relations(payrollRules, ({ one }) => ({
  targetMetric: one(kpiMetrics, {
    fields: [payrollRules.targetMetricId],
    references: [kpiMetrics.id],
  }),
  employee: one(employees, {
    fields: [payrollRules.employeeId],
    references: [employees.id],
  }),
  team: one(teams, {
    fields: [payrollRules.teamId],
    references: [teams.id],
  }),
}));


// Phase 2: Payroll Period
