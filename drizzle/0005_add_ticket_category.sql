DROP TYPE IF EXISTS "ticket_category";

DO $$ BEGIN
  CREATE TYPE "ticket_category" AS ENUM ('request', 'feedback', 'issue', 'general');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "orylis_ticket_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" uuid NOT NULL REFERENCES "orylis_tickets"("id") ON DELETE CASCADE,
  "author_id" text NOT NULL REFERENCES "orylis_profiles"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ticket_messages_ticket_id_idx" ON "orylis_ticket_messages" ("ticket_id");
CREATE INDEX IF NOT EXISTS "ticket_messages_author_id_idx" ON "orylis_ticket_messages" ("author_id");

