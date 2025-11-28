ALTER TABLE "orylis_projects" DROP CONSTRAINT IF EXISTS "orylis_projects_owner_id_fkey";
ALTER TABLE "orylis_projects"
  ALTER COLUMN "owner_id" TYPE text USING "owner_id"::text;
ALTER TABLE "orylis_projects"
  ADD CONSTRAINT "orylis_projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "orylis_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "orylis_tickets" DROP CONSTRAINT IF EXISTS "orylis_tickets_author_id_fkey";
ALTER TABLE "orylis_tickets"
  ALTER COLUMN "author_id" TYPE text USING "author_id"::text;
ALTER TABLE "orylis_tickets"
  ADD CONSTRAINT "orylis_tickets_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "orylis_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "orylis_files" DROP CONSTRAINT IF EXISTS "orylis_files_uploader_id_fkey";
ALTER TABLE "orylis_files"
  ALTER COLUMN "uploader_id" TYPE text USING "uploader_id"::text;
ALTER TABLE "orylis_files"
  ADD CONSTRAINT "orylis_files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "orylis_profiles"("id") ON DELETE CASCADE;

