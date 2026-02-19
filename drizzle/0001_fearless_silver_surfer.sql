CREATE TYPE "public"."report_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('racks', 'devices', 'cables', 'power', 'access');--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"report_type" "report_type" NOT NULL,
	"frequency" "report_frequency" NOT NULL,
	"cron_expression" text NOT NULL,
	"recipient_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "racks" ADD COLUMN "pos_x" integer;--> statement-breakpoint
ALTER TABLE "racks" ADD COLUMN "pos_y" integer;--> statement-breakpoint
ALTER TABLE "racks" ADD COLUMN "rotation" integer DEFAULT 0;