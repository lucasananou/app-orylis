CREATE TABLE IF NOT EXISTS "orylis_knowledge_articles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "content" text NOT NULL,
  "category" text,
  "published" boolean NOT NULL DEFAULT true,
  "author_id" text NOT NULL REFERENCES "orylis_profiles"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "knowledge_articles_author_id_idx" ON "orylis_knowledge_articles" ("author_id");
CREATE INDEX IF NOT EXISTS "knowledge_articles_published_idx" ON "orylis_knowledge_articles" ("published");
CREATE INDEX IF NOT EXISTS "knowledge_articles_category_idx" ON "orylis_knowledge_articles" ("category");

