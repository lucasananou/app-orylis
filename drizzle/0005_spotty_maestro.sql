ALTER TABLE "orylis_profiles" ALTER COLUMN "prospect_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orylis_profiles" ALTER COLUMN "prospect_status" SET DEFAULT 'new'::text;--> statement-breakpoint
DROP TYPE "public"."prospect_status";--> statement-breakpoint
CREATE TYPE "public"."prospect_status" AS ENUM('new', 'contacted', 'meeting', 'proposal', 'won', 'lost');--> statement-breakpoint
ALTER TABLE "orylis_profiles" ALTER COLUMN "prospect_status" SET DEFAULT 'new'::"public"."prospect_status";--> statement-breakpoint
ALTER TABLE "orylis_profiles" ALTER COLUMN "prospect_status" SET DATA TYPE "public"."prospect_status" USING "prospect_status"::"public"."prospect_status";