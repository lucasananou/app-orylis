-- Migration: Add project_messages table for staff messages to prospects/clients
CREATE TABLE IF NOT EXISTS "orylis_project_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "author_id" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "orylis_project_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "orylis_projects" ("id") ON DELETE CASCADE,
  CONSTRAINT "orylis_project_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "orylis_profiles" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "project_messages_project_id_idx" ON "orylis_project_messages" ("project_id");
CREATE INDEX IF NOT EXISTS "project_messages_author_id_idx" ON "orylis_project_messages" ("author_id");
CREATE INDEX IF NOT EXISTS "project_messages_created_at_idx" ON "orylis_project_messages" ("created_at");

