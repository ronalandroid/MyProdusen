-- Data-integrity guard for attendance: you cannot check out before you checked
-- in. checkInTime/checkOutTime are full timestamps (include the date), so
-- overnight shifts (e.g. in 22:00, out 06:00 next day) remain valid.
--
-- Added NOT VALID so it can NEVER fail on pre-existing rows on deploy; it is
-- enforced for every new/updated row. Idempotent via the conname guard so a
-- partial/re-run is safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_checkout_after_checkin'
  ) THEN
    ALTER TABLE "Attendance"
      ADD CONSTRAINT "attendance_checkout_after_checkin"
      CHECK ("checkOutTime" IS NULL OR "checkOutTime" >= "checkInTime") NOT VALID;
  END IF;
END $$;
