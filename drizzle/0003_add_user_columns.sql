ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "emailVerified" timestamptz,
  ADD COLUMN IF NOT EXISTS "image" text;

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_unique" ON "user" ("email");

