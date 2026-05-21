CREATE INDEX IF NOT EXISTS "PayrollStructure_isActive_idx" ON "PayrollStructure" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "EmployeePayroll_structureId_idx" ON "EmployeePayroll" USING btree ("structureId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "EmployeePayroll_effectiveDate_idx" ON "EmployeePayroll" USING btree ("effectiveDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollRun_status_period_idx" ON "PayrollRun" USING btree ("status", "period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PayrollItem_employeeId_runId_idx" ON "PayrollItem" USING btree ("employeeId", "runId");--> statement-breakpoint
