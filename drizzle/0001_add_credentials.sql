CREATE TABLE IF NOT EXISTS "orylis_credentials" (
  "user_id" text PRIMARY KEY REFERENCES "orylis_profiles"("id") ON DELETE CASCADE,
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

