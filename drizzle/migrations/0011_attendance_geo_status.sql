-- Hardened GPS / geo-fence attendance fields.
-- Adds explicit geo_status badges per check-in/out plus a JSON validation
-- metadata column for audit. Existing distance/lat/lon columns stay as-is.
-- Pending geo reviews continue to use the AttendanceException workflow.

ALTER TABLE "Attendance"
  ADD COLUMN IF NOT EXISTS "check_in_geo_status" text;

ALTER TABLE "Attendance"
  ADD COLUMN IF NOT EXISTS "check_out_geo_status" text;

ALTER TABLE "Attendance"
  ADD COLUMN IF NOT EXISTS "geo_validation_metadata" jsonb;

-- Backfill existing rows so reports/dashboards have a sane default.
UPDATE "Attendance"
SET "check_in_geo_status" = COALESCE(
  "check_in_geo_status",
  CASE
    WHEN "checkInDistance" IS NULL THEN 'GPS_UNAVAILABLE'
    WHEN "checkInDistance" <= 100 THEN 'INSIDE_RADIUS'
    ELSE 'OUTSIDE_RADIUS'
  END
);

UPDATE "Attendance"
SET "check_out_geo_status" = COALESCE(
  "check_out_geo_status",
  CASE
    WHEN "checkOutTime" IS NULL THEN NULL
    WHEN "checkOutDistance" IS NULL THEN 'GPS_UNAVAILABLE'
    WHEN "checkOutDistance" <= 100 THEN 'INSIDE_RADIUS'
    ELSE 'OUTSIDE_RADIUS'
  END
);

CREATE INDEX IF NOT EXISTS "Attendance_check_in_geo_status_idx"
  ON "Attendance" ("check_in_geo_status");

CREATE INDEX IF NOT EXISTS "Attendance_check_out_geo_status_idx"
  ON "Attendance" ("check_out_geo_status");
