CREATE TYPE "public"."profile_role" AS ENUM('client', 'staff');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('onboarding', 'design', 'build', 'review', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."storage_provider" AS ENUM('blob', 's3', 'r2', 'uploadthing');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'done');--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp with time zone,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "orylis_billing_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orylis_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"uploader_id" text NOT NULL,
	"storage_provider" "storage_provider" DEFAULT 'blob' NOT NULL,
	"path" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orylis_onboarding_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orylis_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "profile_role" DEFAULT 'client' NOT NULL,
	"full_name" text,
	"company" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orylis_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "project_status" DEFAULT 'onboarding' NOT NULL,
	"progress" integer DEFAULT 10 NOT NULL,
	"due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orylis_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orylis_credentials" (
	"user_id" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orylis_billing_links" ADD CONSTRAINT "orylis_billing_links_project_id_orylis_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."orylis_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_files" ADD CONSTRAINT "orylis_files_project_id_orylis_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."orylis_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_files" ADD CONSTRAINT "orylis_files_uploader_id_orylis_profiles_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."orylis_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_onboarding_responses" ADD CONSTRAINT "orylis_onboarding_responses_project_id_orylis_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."orylis_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_profiles" ADD CONSTRAINT "orylis_profiles_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_projects" ADD CONSTRAINT "orylis_projects_owner_id_orylis_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."orylis_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_tickets" ADD CONSTRAINT "orylis_tickets_project_id_orylis_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."orylis_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_tickets" ADD CONSTRAINT "orylis_tickets_author_id_orylis_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."orylis_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orylis_credentials" ADD CONSTRAINT "orylis_credentials_user_id_orylis_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."orylis_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_project_id_idx" ON "orylis_billing_links" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "files_project_id_idx" ON "orylis_files" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "files_uploader_id_idx" ON "orylis_files" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "onboarding_project_id_idx" ON "orylis_onboarding_responses" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "orylis_profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "projects_owner_id_idx" ON "orylis_projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tickets_project_id_idx" ON "orylis_tickets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tickets_author_id_idx" ON "orylis_tickets" USING btree ("author_id");