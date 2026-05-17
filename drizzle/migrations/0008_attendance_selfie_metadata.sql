-- Realtime attendance selfie storage metadata.
-- Adds size + MIME type fields that complement the existing path/uploaded_at columns
-- introduced in 0007_realtime_attendance_selfie.sql. Columns are nullable for
-- backwards compatibility with historical attendance rows.
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_in_selfie_size_bytes" integer;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_out_selfie_size_bytes" integer;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_in_selfie_mime_type" text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_out_selfie_mime_type" text;
