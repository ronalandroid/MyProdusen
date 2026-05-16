ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_in_selfie_url" text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_out_selfie_url" text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_in_selfie_uploaded_at" timestamp;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "check_out_selfie_uploaded_at" timestamp;

UPDATE "Attendance"
SET "check_in_selfie_url" = COALESCE("check_in_selfie_url", "checkInSelfie"),
    "check_in_selfie_uploaded_at" = COALESCE("check_in_selfie_uploaded_at", "createdAt")
WHERE "checkInSelfie" IS NOT NULL;

UPDATE "Attendance"
SET "check_out_selfie_url" = COALESCE("check_out_selfie_url", "checkOutSelfie"),
    "check_out_selfie_uploaded_at" = COALESCE("check_out_selfie_uploaded_at", "updatedAt")
WHERE "checkOutSelfie" IS NOT NULL;
