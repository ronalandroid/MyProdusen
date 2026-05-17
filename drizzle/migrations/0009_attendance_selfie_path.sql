-- Adds dedicated storage-key columns (`check_in_selfie_path`, `check_out_selfie_path`)
-- separate from the public URL (`check_in_selfie_url`, `check_out_selfie_url`).
-- The path holds only the relative key inside the persistent volume, e.g.
--   attendance-selfies/2026/05/<employeeId>/<attendanceId>-checkin.webp
-- New protected endpoints `/api/attendances/:attendanceId/selfie/{check-in|check-out}`
-- read this column directly so callers no longer need to know the URL layout.
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_in_selfie_path" text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_out_selfie_path" text;

-- Backfill from existing url columns by stripping the public route prefix.
UPDATE "Attendance"
SET "check_in_selfie_path" = regexp_replace(
  COALESCE("check_in_selfie_path", "check_in_selfie_url"),
  '^/api/attendance/selfie/',
  ''
)
WHERE "check_in_selfie_path" IS NULL
  AND "check_in_selfie_url" IS NOT NULL
  AND "check_in_selfie_url" LIKE '/api/attendance/selfie/%';

UPDATE "Attendance"
SET "check_out_selfie_path" = regexp_replace(
  COALESCE("check_out_selfie_path", "check_out_selfie_url"),
  '^/api/attendance/selfie/',
  ''
)
WHERE "check_out_selfie_path" IS NULL
  AND "check_out_selfie_url" IS NOT NULL
  AND "check_out_selfie_url" LIKE '/api/attendance/selfie/%';
