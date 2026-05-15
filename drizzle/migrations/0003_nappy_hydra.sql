CREATE TYPE "public"."AnnouncementCategory" AS ENUM('GENERAL', 'POLICY', 'EVENT', 'EMERGENCY');--> statement-breakpoint
CREATE TYPE "public"."AnnouncementPriority" AS ENUM('NORMAL', 'IMPORTANT', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."DocumentCategory" AS ENUM('CONTRACT', 'CERTIFICATE', 'ID', 'EDUCATION', 'MEDICAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."DocumentStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."HolidayType" AS ENUM('PUBLIC', 'COMPANY', 'RELIGIOUS');--> statement-breakpoint
CREATE TYPE "public"."ReviewCycleStatus" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."ReviewStatus" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED');--> statement-breakpoint
CREATE TABLE "AnnouncementComment" (
	"id" text PRIMARY KEY NOT NULL,
	"announcementId" text NOT NULL,
	"userId" text NOT NULL,
	"comment" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AnnouncementRead" (
	"id" text PRIMARY KEY NOT NULL,
	"announcementId" text NOT NULL,
	"userId" text NOT NULL,
	"readAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" "AnnouncementCategory" DEFAULT 'GENERAL' NOT NULL,
	"priority" "AnnouncementPriority" DEFAULT 'NORMAL' NOT NULL,
	"targetAudience" text DEFAULT 'ALL' NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"publishedBy" text NOT NULL,
	"publishedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompanyEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"location" text,
	"organizer" text NOT NULL,
	"isAllDay" boolean DEFAULT false NOT NULL,
	"color" text DEFAULT '#2563eb',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompanySetting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updatedBy" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "CompanySetting_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "EmployeeDocument" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"category" "DocumentCategory" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"fileUrl" text NOT NULL,
	"fileName" text NOT NULL,
	"fileSize" integer NOT NULL,
	"mimeType" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "DocumentStatus" DEFAULT 'PENDING' NOT NULL,
	"expiryDate" timestamp,
	"uploadedBy" text NOT NULL,
	"approvedBy" text,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Holiday" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" timestamp NOT NULL,
	"type" "HolidayType" DEFAULT 'PUBLIC' NOT NULL,
	"description" text,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PerformanceReview" (
	"id" text PRIMARY KEY NOT NULL,
	"cycleId" text NOT NULL,
	"employeeId" text NOT NULL,
	"reviewerId" text NOT NULL,
	"status" "ReviewStatus" DEFAULT 'PENDING' NOT NULL,
	"selfAssessment" text,
	"managerAssessment" text,
	"overallRating" real,
	"strengths" text,
	"areasForImprovement" text,
	"goals" text,
	"comments" text,
	"submittedAt" timestamp,
	"approvedAt" timestamp,
	"approvedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ReviewCycle" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"status" "ReviewCycleStatus" DEFAULT 'DRAFT' NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ReviewGoal" (
	"id" text PRIMARY KEY NOT NULL,
	"reviewId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"targetDate" timestamp,
	"progress" integer DEFAULT 0 NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "AnnouncementComment_announcementId_idx" ON "AnnouncementComment" USING btree ("announcementId");--> statement-breakpoint
CREATE INDEX "AnnouncementComment_createdAt_idx" ON "AnnouncementComment" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "AnnouncementRead_announcementId_idx" ON "AnnouncementRead" USING btree ("announcementId");--> statement-breakpoint
CREATE INDEX "AnnouncementRead_userId_idx" ON "AnnouncementRead" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead" USING btree ("announcementId","userId");--> statement-breakpoint
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement" USING btree ("publishedAt");--> statement-breakpoint
CREATE INDEX "Announcement_category_idx" ON "Announcement" USING btree ("category");--> statement-breakpoint
CREATE INDEX "Announcement_isPinned_idx" ON "Announcement" USING btree ("isPinned");--> statement-breakpoint
CREATE INDEX "CompanyEvent_startDate_idx" ON "CompanyEvent" USING btree ("startDate");--> statement-breakpoint
CREATE INDEX "CompanySetting_key_idx" ON "CompanySetting" USING btree ("key");--> statement-breakpoint
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "EmployeeDocument_category_idx" ON "EmployeeDocument" USING btree ("category");--> statement-breakpoint
CREATE INDEX "EmployeeDocument_status_idx" ON "EmployeeDocument" USING btree ("status");--> statement-breakpoint
CREATE INDEX "EmployeeDocument_expiryDate_idx" ON "EmployeeDocument" USING btree ("expiryDate");--> statement-breakpoint
CREATE INDEX "Holiday_date_idx" ON "Holiday" USING btree ("date");--> statement-breakpoint
CREATE INDEX "PerformanceReview_cycleId_idx" ON "PerformanceReview" USING btree ("cycleId");--> statement-breakpoint
CREATE INDEX "PerformanceReview_employeeId_idx" ON "PerformanceReview" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "PerformanceReview_status_idx" ON "PerformanceReview" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "PerformanceReview_cycleId_employeeId_key" ON "PerformanceReview" USING btree ("cycleId","employeeId");--> statement-breakpoint
CREATE INDEX "ReviewCycle_status_idx" ON "ReviewCycle" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ReviewCycle_startDate_idx" ON "ReviewCycle" USING btree ("startDate");--> statement-breakpoint
CREATE INDEX "ReviewGoal_reviewId_idx" ON "ReviewGoal" USING btree ("reviewId");