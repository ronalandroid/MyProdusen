-- Final hardening indexes for sensitive reports and RBAC-scoped queries.
-- Safe, additive-only. No data is modified.
CREATE INDEX IF NOT EXISTS "Employee_status_idx"
  ON "Employee" ("status");

CREATE INDEX IF NOT EXISTS "Employee_division_idx"
  ON "Employee" ("division");

CREATE INDEX IF NOT EXISTS "Attendance_check_in_geo_status_idx"
  ON "Attendance" ("check_in_geo_status");

CREATE INDEX IF NOT EXISTS "Attendance_check_out_geo_status_idx"
  ON "Attendance" ("check_out_geo_status");
