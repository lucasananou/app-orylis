CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "profile_role" AS ENUM ('client', 'staff');
CREATE TYPE "project_status" AS ENUM ('onboarding', 'design', 'build', 'review', 'delivered');
CREATE TYPE "ticket_status" AS ENUM ('open', 'in_progress', 'done');
CREATE TYPE "storage_provider" AS ENUM ('blob', 's3', 'r2', 'uploadthing');

CREATE TABLE IF NOT EXISTS "orylis_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text,
  "email" text NOT NULL,
  "email_verified" timestamptz,
  "image" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "orylis_users" ("email");
ALTER TABLE "orylis_users" ADD CONSTRAINT "users_email_unique" UNIQUE USING INDEX "users_email_idx";

CREATE TABLE IF NOT EXISTS "orylis_accounts" (
  "user_id" uuid NOT NULL,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  CONSTRAINT "orylis_accounts_provider_provider_account_id_pk" PRIMARY KEY ("provider", "provider_account_id"),
  CONSTRAINT "orylis_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "orylis_users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "orylis_accounts" ("user_id");

CREATE TABLE IF NOT EXISTS "orylis_sessions" (
  "session_token" text PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "expires" timestamptz NOT NULL,
  CONSTRAINT "orylis_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "orylis_users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "orylis_sessions" ("user_id");

CREATE TABLE IF NOT EXISTS "orylis_verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamptz NOT NULL,
  CONSTRAINT "orylis_verification_tokens_identifier_token_pk" PRIMARY KEY ("identifier", "token")
);

CREATE TABLE IF NOT EXISTS "orylis_profiles" (
  "id" uuid PRIMARY KEY,
  "role" "profile_role" NOT NULL DEFAULT 'client',
  "full_name" text,
  "company" text,
  "phone" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "orylis_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "orylis_users" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "profiles_role_idx" ON "orylis_profiles" ("role");

CREATE TABLE IF NOT EXISTS "orylis_projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" uuid NOT NULL,
  "name" text NOT NULL,
  "status" "project_status" NOT NULL DEFAULT 'onboarding',
  "progress" integer NOT NULL DEFAULT 10,
  "due_date" date,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "orylis_projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "orylis_profiles" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "projects_owner_id_idx" ON "orylis_projects" ("owner_id");

CREATE TABLE IF NOT EXISTS "orylis_onboarding_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "payload" jsonb NOT NULL,
  "completed" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "orylis_onboarding_responses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "orylis_projects" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "onboarding_project_id_idx" ON "orylis_onboarding_responses" ("project_id");

CREATE TABLE IF NOT EXISTS "orylis_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "status" "ticket_status" NOT NULL DEFAULT 'open',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "orylis_tickets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "orylis_projects" ("id") ON DELETE CASCADE,
  CONSTRAINT "orylis_tickets_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "orylis_profiles" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "tickets_project_id_idx" ON "orylis_tickets" ("project_id");
CREATE INDEX IF NOT EXISTS "tickets_author_id_idx" ON "orylis_tickets" ("author_id");

CREATE TABLE IF NOT EXISTS "orylis_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "uploader_id" uuid NOT NULL,
  "storage_provider" "storage_provider" NOT NULL DEFAULT 'blob',
  "path" text NOT NULL,
  "label" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "orylis_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "orylis_projects" ("id") ON DELETE CASCADE,
  CONSTRAINT "orylis_files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "orylis_profiles" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "files_project_id_idx" ON "orylis_files" ("project_id");
CREATE INDEX IF NOT EXISTS "files_uploader_id_idx" ON "orylis_files" ("uploader_id");

CREATE TABLE IF NOT EXISTS "orylis_billing_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "label" text NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "orylis_billing_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "orylis_projects" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "billing_project_id_idx" ON "orylis_billing_links" ("project_id");

