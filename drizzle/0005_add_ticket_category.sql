DO $$ BEGIN
  CREATE TYPE "ticket_category" AS ENUM ('request', 'feedback', 'issue', 'general');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "orylis_tickets"
  ADD COLUMN IF NOT EXISTS "category" "ticket_category" NOT NULL DEFAULT 'request';

