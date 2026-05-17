-- Indexes that speed up attendance reporting and history pagination.
-- Safe, additive-only. No data is touched.
CREATE INDEX IF NOT EXISTS "Attendance_employeeId_checkInTime_idx"
  ON "Attendance" ("employeeId", "checkInTime" DESC);

CREATE INDEX IF NOT EXISTS "Attendance_status_checkInTime_idx"
  ON "Attendance" ("status", "checkInTime" DESC);

CREATE INDEX IF NOT EXISTS "Employee_division_idx"
  ON "Employee" ("division");
