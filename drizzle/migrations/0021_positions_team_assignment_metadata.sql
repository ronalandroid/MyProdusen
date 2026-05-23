CREATE TABLE IF NOT EXISTS "Position" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "teamId" text,
  "roleType" text,
  "active" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "EmployeeTeamAssignment" ADD COLUMN IF NOT EXISTS "positionId" text;

CREATE UNIQUE INDEX IF NOT EXISTS "Team_slug_unique" ON "Team" ("slug") WHERE "slug" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Position_name_idx" ON "Position" ("name");
CREATE INDEX IF NOT EXISTS "Position_teamId_idx" ON "Position" ("teamId");
CREATE INDEX IF NOT EXISTS "Position_active_idx" ON "Position" ("active");
CREATE INDEX IF NOT EXISTS "EmployeeTeamAssignment_positionId_idx" ON "EmployeeTeamAssignment" ("positionId");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeTeamAssignment_active_primary_employee_unique" ON "EmployeeTeamAssignment" ("employeeId") WHERE "active" = true;

UPDATE "Team"
SET "slug" = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;
