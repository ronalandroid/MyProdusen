-- Add unique constraint to prevent multiple check-ins per employee per day
-- This ensures one attendance record per employee per calendar day

-- First, create a function to extract date from timestamp
CREATE OR REPLACE FUNCTION get_date_only(ts timestamp) 
RETURNS date AS $$
BEGIN
  RETURN ts::date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a unique index on employeeId and date part of checkInTime
-- This prevents duplicate check-ins on the same day
CREATE UNIQUE INDEX IF NOT EXISTS "idx_attendance_employee_date_unique" 
ON "Attendance" ("employeeId", (get_date_only("checkInTime")));

-- Add comment for documentation
COMMENT ON INDEX "idx_attendance_employee_date_unique" IS 
'Ensures one attendance check-in per employee per calendar day';
