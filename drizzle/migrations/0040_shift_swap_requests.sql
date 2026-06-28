-- Shift swap — employee requests to exchange a scheduled shift with a colleague.
CREATE TABLE IF NOT EXISTS "ShiftSwapRequest" (
  "id" text PRIMARY KEY NOT NULL,
  "requesterId" text NOT NULL,
  "requesterDate" timestamp NOT NULL,
  "targetId" text NOT NULL,
  "targetDate" timestamp NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "reviewedBy" text,
  "reviewedAt" timestamp,
  "rejectionReason" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_requesterId_idx" ON "ShiftSwapRequest" ("requesterId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_targetId_idx" ON "ShiftSwapRequest" ("targetId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_status_idx" ON "ShiftSwapRequest" ("status");
