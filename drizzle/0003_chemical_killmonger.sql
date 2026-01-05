ALTER TABLE "orylis_quotes" ADD COLUMN "amount" integer;--> statement-breakpoint
ALTER TABLE "orylis_quotes" ADD COLUMN "services" jsonb;--> statement-breakpoint
ALTER TABLE "orylis_quotes" ADD COLUMN "delay" text;