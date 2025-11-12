-- Create enum for email template types
CREATE TYPE "email_template_type" AS ENUM (
  'welcome',
  'ticket_created',
  'ticket_reply',
  'ticket_updated',
  'file_uploaded',
  'onboarding_completed',
  'project_updated'
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS "orylis_email_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "email_template_type" NOT NULL UNIQUE,
  "subject" text NOT NULL,
  "html_content" text NOT NULL,
  "text_content" text,
  "variables" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create index on type
CREATE INDEX IF NOT EXISTS "email_templates_type_idx" ON "orylis_email_templates" ("type");

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON "orylis_email_templates"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

