CREATE TYPE "public"."AttendanceExceptionType" AS ENUM('OUTSIDE_GEOFENCE', 'BAD_GPS_ACCURACY', 'MISSING_SELFIE', 'MANUAL_ADJUSTMENT', 'LATE_CORRECTION', 'MISSING_CHECKOUT');--> statement-breakpoint
CREATE TYPE "public"."AttendanceExceptionStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "AttendanceException" (
  "id" text PRIMARY KEY NOT NULL,
  "attendanceId" text,
  "employeeId" text NOT NULL,
  "type" "AttendanceExceptionType" NOT NULL,
  "status" "AttendanceExceptionStatus" DEFAULT 'PENDING' NOT NULL,
  "reason" text NOT NULL,
  "requestedBy" text NOT NULL,
  "reviewedBy" text,
  "reviewNote" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "reviewedAt" timestamp,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "AttendanceException_attendanceId_idx" ON "AttendanceException" USING btree ("attendanceId");--> statement-breakpoint
CREATE INDEX "AttendanceException_employeeId_idx" ON "AttendanceException" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "AttendanceException_status_idx" ON "AttendanceException" USING btree ("status");--> statement-breakpoint
CREATE INDEX "AttendanceException_type_idx" ON "AttendanceException" USING btree ("type");--> statement-breakpoint
CREATE INDEX "AttendanceException_createdAt_idx" ON "AttendanceException" USING btree ("createdAt");
