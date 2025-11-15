-- Migration: Add demo_url field to projects and demo_in_progress status
-- Non-destructive: adds optional field and new enum value

-- Add new status to enum (PostgreSQL requires ALTER TYPE)
ALTER TYPE "project_status" ADD VALUE IF NOT EXISTS 'demo_in_progress';

-- Add demo_url column (nullable, no default to avoid breaking existing data)
ALTER TABLE "orylis_projects" ADD COLUMN IF NOT EXISTS "demo_url" text;

