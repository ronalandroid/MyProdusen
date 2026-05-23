ALTER TYPE "public"."UserRole" ADD VALUE IF NOT EXISTS 'LEADER';

DO $$ BEGIN
  CREATE TYPE "public"."KpiProductionEntryStatus" AS ENUM('DRAFT', 'SUBMITTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Team" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "description" text,
  "active" boolean DEFAULT true NOT NULL,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "LeaderAssignment" (
  "id" text PRIMARY KEY NOT NULL,
  "leaderUserId" text NOT NULL,
  "teamId" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "EmployeeTeamAssignment" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "teamId" text NOT NULL,
  "assignedBy" text,
  "active" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "KpiProductionEntry" (
  "id" text PRIMARY KEY NOT NULL,
  "employeeId" text NOT NULL,
  "teamId" text NOT NULL,
  "leaderUserId" text NOT NULL,
  "date" date NOT NULL,
  "metricType" text NOT NULL,
  "quantity" numeric(12, 2) NOT NULL,
  "unit" text DEFAULT 'pcs' NOT NULL,
  "note" text,
  "status" "public"."KpiProductionEntryStatus" DEFAULT 'SUBMITTED' NOT NULL,
  "createdBy" text NOT NULL,
  "updatedBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "Team_name_idx" ON "Team" ("name");
CREATE INDEX IF NOT EXISTS "Team_active_idx" ON "Team" ("active");
CREATE INDEX IF NOT EXISTS "LeaderAssignment_leaderUserId_idx" ON "LeaderAssignment" ("leaderUserId");
CREATE INDEX IF NOT EXISTS "LeaderAssignment_teamId_idx" ON "LeaderAssignment" ("teamId");
CREATE INDEX IF NOT EXISTS "LeaderAssignment_active_idx" ON "LeaderAssignment" ("active");
CREATE UNIQUE INDEX IF NOT EXISTS "LeaderAssignment_active_leader_team_unique" ON "LeaderAssignment" ("leaderUserId", "teamId") WHERE "active" = true;
CREATE INDEX IF NOT EXISTS "EmployeeTeamAssignment_employeeId_idx" ON "EmployeeTeamAssignment" ("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeTeamAssignment_teamId_idx" ON "EmployeeTeamAssignment" ("teamId");
CREATE INDEX IF NOT EXISTS "EmployeeTeamAssignment_active_idx" ON "EmployeeTeamAssignment" ("active");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeTeamAssignment_active_employee_team_unique" ON "EmployeeTeamAssignment" ("employeeId", "teamId") WHERE "active" = true;
CREATE INDEX IF NOT EXISTS "KpiProductionEntry_date_idx" ON "KpiProductionEntry" ("date");
CREATE INDEX IF NOT EXISTS "KpiProductionEntry_employeeId_idx" ON "KpiProductionEntry" ("employeeId");
CREATE INDEX IF NOT EXISTS "KpiProductionEntry_teamId_idx" ON "KpiProductionEntry" ("teamId");
CREATE INDEX IF NOT EXISTS "KpiProductionEntry_leaderUserId_idx" ON "KpiProductionEntry" ("leaderUserId");
CREATE INDEX IF NOT EXISTS "KpiProductionEntry_metricType_idx" ON "KpiProductionEntry" ("metricType");
CREATE INDEX IF NOT EXISTS "KpiProductionEntry_createdAt_idx" ON "KpiProductionEntry" ("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "KpiProductionEntry_employee_team_date_metric_unique" ON "KpiProductionEntry" ("employeeId", "teamId", "date", "metricType");
