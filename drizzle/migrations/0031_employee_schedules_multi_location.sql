-- 0031_employee_schedules_multi_location.sql
-- Additive only. No DROP/DELETE/TRUNCATE. Supports per-day employee schedules
-- and multiple valid work locations per schedule, plus special-shift flag.

-- 1) Special shift flag on Shift (configurable by Superadmin)
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "isSpecialShift" boolean NOT NULL DEFAULT false;

-- 2) EmployeeSchedule: assign a shift to an employee on a specific date
CREATE TABLE IF NOT EXISTS "EmployeeSchedule" (
  "id" text PRIMARY KEY,
  "employeeId" text NOT NULL,
  "shiftId" text NOT NULL,
  "date" date NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdBy" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeSchedule_employeeId_date_key"
  ON "EmployeeSchedule" ("employeeId", "date");
CREATE INDEX IF NOT EXISTS "EmployeeSchedule_employeeId_idx" ON "EmployeeSchedule" ("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeSchedule_shiftId_idx" ON "EmployeeSchedule" ("shiftId");
CREATE INDEX IF NOT EXISTS "EmployeeSchedule_date_idx" ON "EmployeeSchedule" ("date");

-- 3) ScheduleLocation: one schedule can have multiple valid work locations
CREATE TABLE IF NOT EXISTS "ScheduleLocation" (
  "id" text PRIMARY KEY,
  "scheduleId" text NOT NULL,
  "workLocationId" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleLocation_scheduleId_workLocationId_key"
  ON "ScheduleLocation" ("scheduleId", "workLocationId");
CREATE INDEX IF NOT EXISTS "ScheduleLocation_scheduleId_idx" ON "ScheduleLocation" ("scheduleId");
CREATE INDEX IF NOT EXISTS "ScheduleLocation_workLocationId_idx" ON "ScheduleLocation" ("workLocationId");

-- 4) ShiftLocation: default valid locations for a shift (used when no schedule override)
CREATE TABLE IF NOT EXISTS "ShiftLocation" (
  "id" text PRIMARY KEY,
  "shiftId" text NOT NULL,
  "workLocationId" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShiftLocation_shiftId_workLocationId_key"
  ON "ShiftLocation" ("shiftId", "workLocationId");
CREATE INDEX IF NOT EXISTS "ShiftLocation_shiftId_idx" ON "ShiftLocation" ("shiftId");
CREATE INDEX IF NOT EXISTS "ShiftLocation_workLocationId_idx" ON "ShiftLocation" ("workLocationId");

-- 5) Link attendance to the schedule it fulfilled (nullable, additive)
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "scheduleId" text;
CREATE INDEX IF NOT EXISTS "Attendance_scheduleId_idx" ON "Attendance" ("scheduleId");
