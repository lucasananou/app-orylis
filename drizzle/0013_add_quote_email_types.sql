-- Migration: Add quote email template types
-- Date: 2025-01-XX

-- Add new email template types for quote signing
ALTER TYPE "email_template_type" ADD VALUE IF NOT EXISTS 'quote_signed';
ALTER TYPE "email_template_type" ADD VALUE IF NOT EXISTS 'quote_signed_admin';

