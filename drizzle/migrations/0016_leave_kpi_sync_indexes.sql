CREATE INDEX IF NOT EXISTS "LeaveRequest_status_createdAt_idx" ON "LeaveRequest" USING btree ("status", "createdAt" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LeaveRequest_employeeId_status_startDate_endDate_idx" ON "LeaveRequest" USING btree ("employeeId", "status", "startDate", "endDate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "KpiTemplate_isActive_idx" ON "KpiTemplate" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "KpiAssignment_templateId_period_idx" ON "KpiAssignment" USING btree ("templateId", "period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "KpiResult_employeeId_period_idx" ON "KpiResult" USING btree ("employeeId", "period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "KpiResult_isApproved_period_idx" ON "KpiResult" USING btree ("isApproved", "period");--> statement-breakpoint
