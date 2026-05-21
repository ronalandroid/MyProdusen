CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AuditLog_entity_createdAt_idx" ON "AuditLog" USING btree ("entity", "createdAt" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog" USING btree ("userId", "createdAt" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification" USING btree ("userId", "isRead", "createdAt" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification" USING btree ("userId", "createdAt" DESC);--> statement-breakpoint
