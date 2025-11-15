-- Migration: Add quotes table for quote generation and signature
-- Date: 2025-01-XX

-- Create enum for quote status
CREATE TYPE "quote_status" AS ENUM ('pending', 'signed', 'cancelled');

-- Create quotes table
CREATE TABLE IF NOT EXISTS "orylis_quotes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "orylis_projects"("id") ON DELETE CASCADE,
  "pdf_url" text NOT NULL,
  "signed_pdf_url" text,
  "status" "quote_status" NOT NULL DEFAULT 'pending',
  "signed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "quotes_project_id_idx" ON "orylis_quotes" ("project_id");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "orylis_quotes" ("status");

-- Add trigger to update updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON "orylis_quotes"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

