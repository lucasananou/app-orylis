DO $$
BEGIN
  CREATE TYPE "notification_type" AS ENUM (
    'ticket_created',
    'ticket_updated',
    'file_uploaded',
    'billing_added',
    'onboarding_update',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "orylis_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "orylis_profiles" ("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "orylis_projects" ("id") ON DELETE SET NULL,
  "type" "notification_type" NOT NULL DEFAULT 'system',
  "title" text NOT NULL,
  "body" text NOT NULL,
  "metadata" jsonb,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "orylis_notifications_user_id_idx" ON "orylis_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "orylis_notifications_project_id_idx" ON "orylis_notifications" ("project_id");
CREATE INDEX IF NOT EXISTS "orylis_notifications_read_at_idx" ON "orylis_notifications" ("read_at");

CREATE TABLE IF NOT EXISTS "orylis_notification_preferences" (
  "user_id" text PRIMARY KEY REFERENCES "orylis_profiles" ("id") ON DELETE CASCADE,
  "email_notifications" boolean NOT NULL DEFAULT TRUE,
  "ticket_updates" boolean NOT NULL DEFAULT TRUE,
  "file_updates" boolean NOT NULL DEFAULT TRUE,
  "billing_updates" boolean NOT NULL DEFAULT TRUE,
  "onboarding_updates" boolean NOT NULL DEFAULT TRUE,
  "marketing" boolean NOT NULL DEFAULT FALSE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
