-- Migration: Ajout d'index composites pour améliorer les performances
-- Ces index n'affectent pas les données, seulement les performances des requêtes

-- Index composite pour tickets : WHERE projectId IN (...) AND status = 'open'
CREATE INDEX IF NOT EXISTS "tickets_project_status_idx" ON "orylis_tickets" ("project_id", "status");

-- Index composite pour tickets : WHERE projectId IN (...) ORDER BY updatedAt DESC
CREATE INDEX IF NOT EXISTS "tickets_project_updated_idx" ON "orylis_tickets" ("project_id", "updated_at" DESC);

-- Index composite pour notifications : WHERE userId = ? AND readAt IS NULL
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "orylis_notifications" ("user_id", "read_at");

-- Index composite pour notifications : WHERE userId = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "orylis_notifications" ("user_id", "created_at" DESC);

-- Index composite pour files : WHERE projectId IN (...) ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "files_project_created_idx" ON "orylis_files" ("project_id", "created_at" DESC);

-- Index composite pour billing_links : WHERE projectId IN (...) ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "billing_project_created_idx" ON "orylis_billing_links" ("project_id", "created_at" DESC);

-- Index composite pour project_messages : WHERE projectId = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "project_messages_project_created_idx" ON "orylis_project_messages" ("project_id", "created_at" DESC);

