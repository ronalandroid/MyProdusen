CREATE INDEX IF NOT EXISTS "Attendance_shiftId_idx" ON "Attendance" USING btree ("shiftId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AttendanceException_status_createdAt_idx" ON "AttendanceException" USING btree ("status", "createdAt" DESC);--> statement-breakpoint
