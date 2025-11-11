# 03 · DB Schema (PostgreSQL · Railway)

> Deux approches :  
> 1) **SQL brut** (ci-dessous) avec migrations manuelles.  
> 2) **Drizzle ORM** (reproduire ces tables dans `schema.ts`).

## Auth.js (tables min.) via Drizzle Adapter
Si tu utilises `@auth/drizzle-adapter`, il crée/attend ces tables :
- `users`
- `accounts`
- `sessions`
- `verification_tokens`

> Tu peux laisser l'adapter créer les tables via migrations Drizzle, ou recopier la spec de l'adapter.

## Noyau applicatif

```sql
-- 1) profiles
create table if not exists profiles (
  id uuid primary key,            -- = users.id (Auth.js)
  role text not null default 'client' check (role in ('client','staff')),
  full_name text,
  company text,
  phone text,
  created_at timestamptz not null default now()
);

-- FK vers users (si tu veux lier explicitement)
-- alter table profiles add constraint fk_profiles_users foreign key (id) references users(id) on delete cascade;

-- 2) projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  status text not null default 'onboarding' check (status in ('onboarding','design','build','review','delivered')),
  progress int not null default 10,
  due_date date,
  created_at timestamptz not null default now()
);

-- 3) onboarding_responses
create table if not exists onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  payload jsonb not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) tickets
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) files (métadonnées)
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  uploader_id uuid not null references profiles(id) on delete cascade,
  storage_provider text not null default 'blob',   -- 'blob' | 's3' | 'r2' | 'uploadthing'
  path text not null,
  label text,
  created_at timestamptz not null default now()
);

-- 6) billing_links (liens externes)
create table if not exists billing_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

-- Index utiles
create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_onboarding_project on onboarding_responses(project_id);
create index if not exists idx_tickets_project on tickets(project_id);
create index if not exists idx_files_project on files(project_id);
create index if not exists idx_billing_project on billing_links(project_id);
```

## Seed minimal (optionnel)
- Un user staff (manuellement) + un projet de test.
