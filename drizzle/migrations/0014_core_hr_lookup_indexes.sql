CREATE INDEX IF NOT EXISTS "Employee_defaultShiftId_idx" ON "Employee" USING btree ("defaultShiftId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Employee_defaultLocationId_idx" ON "Employee" USING btree ("defaultLocationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WorkLocation_name_idx" ON "WorkLocation" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Shift_isActive_idx" ON "Shift" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Shift_name_idx" ON "Shift" USING btree ("name");--> statement-breakpoint
