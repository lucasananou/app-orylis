ALTER TYPE "public"."profile_role" ADD VALUE 'sales';--> statement-breakpoint
ALTER TABLE "orylis_profiles" ADD COLUMN "meeting_booked_at" timestamp with time zone;
