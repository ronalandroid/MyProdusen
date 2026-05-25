DO $$ BEGIN
  CREATE TYPE "PolicyScopeType" AS ENUM ('COMPANY', 'TEAM', 'EMPLOYEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkCalendarDayType" AS ENUM ('WORKDAY', 'HOLIDAY', 'COMPANY_HOLIDAY', 'SPECIAL_WORKDAY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PayrollCalculationSourceType" AS ENUM ('ATTENDANCE', 'KPI', 'HOLIDAY', 'MANUAL', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AttendancePolicy" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "appliesScopeType" "PolicyScopeType" DEFAULT 'COMPANY' NOT NULL,
  "appliesScopeId" text,
  "graceMinutes" integer DEFAULT 0 NOT NULL,
  "lateTier1Min" integer DEFAULT 1 NOT NULL,
  "lateTier1Max" integer DEFAULT 15 NOT NULL,
  "lateTier1Deduction" real DEFAULT 5000 NOT NULL,
  "lateTier2Min" integer DEFAULT 16 NOT NULL,
  "lateTier2Max" integer DEFAULT 30 NOT NULL,
  "lateTier2Deduction" real DEFAULT 10000 NOT NULL,
  "halfDayAfterMinutes" integer DEFAULT 30 NOT NULL,
  "halfDayPayFactor" real DEFAULT 0.5 NOT NULL,
  "geofenceRadiusMeters" integer DEFAULT 150 NOT NULL,
  "payrollSyncEnabled" boolean DEFAULT true NOT NULL,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "AttendanceDailySummary" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "attendanceId" text,
  "workDate" date NOT NULL,
  "shiftStartAt" timestamp,
  "clockInAt" timestamp,
  "clockOutAt" timestamp,
  "lateMinutes" integer DEFAULT 0 NOT NULL,
  "lateDeduction" real DEFAULT 0 NOT NULL,
  "isHalfDay" boolean DEFAULT false NOT NULL,
  "geofenceDistanceMeters" real,
  "gpsAccuracyMeters" real,
  "selfieRequired" boolean DEFAULT true NOT NULL,
  "selfieVerified" boolean DEFAULT false NOT NULL,
  "payrollImpactStatus" text DEFAULT 'NO_IMPACT' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "WorkCalendarDay" (
  "id" text PRIMARY KEY NOT NULL,
  "date" date NOT NULL,
  "name" text NOT NULL,
  "type" "WorkCalendarDayType" DEFAULT 'WORKDAY' NOT NULL,
  "isPaidHoliday" boolean DEFAULT false NOT NULL,
  "payMultiplier" real DEFAULT 1 NOT NULL,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "PayrollCalculationHistory" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "payrollPeriodId" text,
  "workDate" date,
  "sourceType" "PayrollCalculationSourceType" NOT NULL,
  "sourceId" text,
  "description" text NOT NULL,
  "amount" real DEFAULT 0 NOT NULL,
  "calculationSnapshot" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "divisionId" text;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "attendancePolicyId" text;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "holidayMultiplierEnabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "PayrollRule" ADD COLUMN IF NOT EXISTS "realtimeCalculationEnabled" boolean DEFAULT true NOT NULL;

CREATE INDEX IF NOT EXISTS "AttendancePolicy_active_idx" ON "AttendancePolicy" ("active");
CREATE INDEX IF NOT EXISTS "AttendancePolicy_scope_idx" ON "AttendancePolicy" ("appliesScopeType", "appliesScopeId");
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceDailySummary_employee_workDate_idx" ON "AttendanceDailySummary" ("employeeId", "workDate");
CREATE INDEX IF NOT EXISTS "AttendanceDailySummary_attendanceId_idx" ON "AttendanceDailySummary" ("attendanceId");
CREATE INDEX IF NOT EXISTS "AttendanceDailySummary_payrollImpactStatus_idx" ON "AttendanceDailySummary" ("payrollImpactStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkCalendarDay_date_idx" ON "WorkCalendarDay" ("date");
CREATE INDEX IF NOT EXISTS "WorkCalendarDay_type_idx" ON "WorkCalendarDay" ("type");
CREATE INDEX IF NOT EXISTS "PayrollCalculationHistory_employee_workDate_idx" ON "PayrollCalculationHistory" ("employeeId", "workDate");
CREATE INDEX IF NOT EXISTS "PayrollCalculationHistory_source_idx" ON "PayrollCalculationHistory" ("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "PayrollCalculationHistory_payrollPeriodId_idx" ON "PayrollCalculationHistory" ("payrollPeriodId");
CREATE INDEX IF NOT EXISTS "PayrollRule_divisionId_idx" ON "PayrollRule" ("divisionId");
CREATE INDEX IF NOT EXISTS "PayrollRule_attendancePolicyId_idx" ON "PayrollRule" ("attendancePolicyId");

INSERT INTO "AttendancePolicy" (
  "id", "name", "active", "appliesScopeType", "graceMinutes",
  "lateTier1Min", "lateTier1Max", "lateTier1Deduction",
  "lateTier2Min", "lateTier2Max", "lateTier2Deduction",
  "halfDayAfterMinutes", "halfDayPayFactor", "geofenceRadiusMeters",
  "payrollSyncEnabled", "createdAt", "updatedAt"
) VALUES (
  'default_company_attendance_policy', 'Default Company Attendance Policy', true, 'COMPANY', 0,
  1, 15, 5000,
  16, 30, 10000,
  30, 0.5, 150,
  true, now(), now()
) ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "WorkLocation" ALTER COLUMN "radius" SET DEFAULT 150;
