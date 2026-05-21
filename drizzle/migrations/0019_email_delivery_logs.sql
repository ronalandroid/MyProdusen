CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id" text PRIMARY KEY NOT NULL,
  "template" text NOT NULL,
  "recipient" text NOT NULL,
  "subject" text NOT NULL,
  "provider" text DEFAULT 'resend' NOT NULL,
  "providerMessageId" text,
  "status" text NOT NULL,
  "errorMessage" text,
  "metadata" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "EmailLog_template_createdAt_idx" ON "EmailLog" USING btree ("template", "createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "EmailLog_recipient_createdAt_idx" ON "EmailLog" USING btree ("recipient", "createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "EmailLog_status_createdAt_idx" ON "EmailLog" USING btree ("status", "createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "EmailLog_providerMessageId_idx" ON "EmailLog" USING btree ("providerMessageId");
