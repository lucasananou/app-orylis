-- Migration: Ajouter les types d'emails prospect
-- Date: 2025-01-XX

-- Ajouter les nouveaux types d'emails prospect à l'enum
ALTER TYPE "email_template_type" ADD VALUE IF NOT EXISTS 'prospect_welcome';
ALTER TYPE "email_template_type" ADD VALUE IF NOT EXISTS 'prospect_onboarding_completed';
ALTER TYPE "email_template_type" ADD VALUE IF NOT EXISTS 'prospect_demo_ready';

