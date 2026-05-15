CREATE TYPE "public"."AttendanceStatus" AS ENUM('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'SICK', 'PERMISSION');--> statement-breakpoint
CREATE TYPE "public"."EmployeeStatus" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."KpiScoringType" AS ENUM('HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'BOOLEAN');--> statement-breakpoint
CREATE TYPE "public"."LeaveStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."LeaveType" AS ENUM('LEAVE', 'SICK', 'PERMISSION');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE');--> statement-breakpoint
CREATE TABLE "Attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"workLocationId" text NOT NULL,
	"shiftId" text,
	"checkInTime" timestamp NOT NULL,
	"checkInLatitude" real NOT NULL,
	"checkInLongitude" real NOT NULL,
	"checkInAccuracy" real,
	"checkInDistance" real,
	"checkInSelfie" text NOT NULL,
	"checkInDeviceInfo" text,
	"checkInIp" text,
	"checkInUserAgent" text,
	"checkOutTime" timestamp,
	"checkOutLatitude" real,
	"checkOutLongitude" real,
	"checkOutAccuracy" real,
	"checkOutDistance" real,
	"checkOutSelfie" text,
	"checkOutDeviceInfo" text,
	"checkOutIp" text,
	"checkOutUserAgent" text,
	"status" "AttendanceStatus" DEFAULT 'PRESENT' NOT NULL,
	"lateMinutes" integer DEFAULT 0 NOT NULL,
	"earlyLeaveMinutes" integer DEFAULT 0 NOT NULL,
	"totalWorkMinutes" integer DEFAULT 0 NOT NULL,
	"isManualAdjustment" boolean DEFAULT false NOT NULL,
	"adjustmentReason" text,
	"adjustedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entityId" text,
	"oldValue" text,
	"newValue" text,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Employee" (
	"id" text PRIMARY KEY NOT NULL,
	"nip" text NOT NULL,
	"userId" text NOT NULL,
	"fullName" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"joinDate" timestamp DEFAULT now() NOT NULL,
	"division" text,
	"position" text,
	"supervisorId" text,
	"status" "EmployeeStatus" DEFAULT 'ACTIVE' NOT NULL,
	"profilePhoto" text,
	"emergencyContact" text,
	"defaultShiftId" text,
	"defaultLocationId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Employee_nip_unique" UNIQUE("nip"),
	CONSTRAINT "Employee_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "KpiAssignment" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"templateId" text NOT NULL,
	"period" text NOT NULL,
	"assignedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "KpiItem" (
	"id" text PRIMARY KEY NOT NULL,
	"templateId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"weight" real DEFAULT 1 NOT NULL,
	"scoringType" "KpiScoringType" DEFAULT 'HIGHER_IS_BETTER' NOT NULL,
	"targetValue" real,
	"minValue" real,
	"maxValue" real,
	"unit" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "KpiResult" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"itemId" text NOT NULL,
	"period" text NOT NULL,
	"actualValue" real NOT NULL,
	"score" real NOT NULL,
	"isApproved" boolean DEFAULT false NOT NULL,
	"approvedBy" text,
	"approvedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "KpiTemplate" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LeaveRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"type" "LeaveType" NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"reason" text NOT NULL,
	"status" "LeaveStatus" DEFAULT 'PENDING' NOT NULL,
	"approvedBy" text,
	"approvedAt" timestamp,
	"rejectedBy" text,
	"rejectedAt" timestamp,
	"rejectionReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Shift" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"startTime" text NOT NULL,
	"endTime" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "UserRole" DEFAULT 'EMPLOYEE' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "WorkLocation" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius" integer DEFAULT 100 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "Attendance_employeeId_idx" ON "Attendance" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "Attendance_workLocationId_idx" ON "Attendance" USING btree ("workLocationId");--> statement-breakpoint
CREATE INDEX "Attendance_checkInTime_idx" ON "Attendance" USING btree ("checkInTime");--> statement-breakpoint
CREATE INDEX "Attendance_status_idx" ON "Attendance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog" USING btree ("entity");--> statement-breakpoint
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Employee_nip_idx" ON "Employee" USING btree ("nip");--> statement-breakpoint
CREATE INDEX "Employee_userId_idx" ON "Employee" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Employee_supervisorId_idx" ON "Employee" USING btree ("supervisorId");--> statement-breakpoint
CREATE INDEX "KpiAssignment_employeeId_idx" ON "KpiAssignment" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "KpiAssignment_period_idx" ON "KpiAssignment" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "KpiAssignment_employeeId_templateId_period_key" ON "KpiAssignment" USING btree ("employeeId","templateId","period");--> statement-breakpoint
CREATE INDEX "KpiItem_templateId_idx" ON "KpiItem" USING btree ("templateId");--> statement-breakpoint
CREATE INDEX "KpiResult_employeeId_idx" ON "KpiResult" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "KpiResult_period_idx" ON "KpiResult" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "KpiResult_employeeId_itemId_period_key" ON "KpiResult" USING btree ("employeeId","itemId","period");--> statement-breakpoint
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest" USING btree ("status");--> statement-breakpoint
CREATE INDEX "LeaveRequest_startDate_idx" ON "LeaveRequest" USING btree ("startDate");--> statement-breakpoint
CREATE INDEX "Notification_userId_idx" ON "Notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Notification_isRead_idx" ON "Notification" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "User_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_username_idx" ON "User" USING btree ("username");--> statement-breakpoint
CREATE INDEX "WorkLocation_isActive_idx" ON "WorkLocation" USING btree ("isActive");