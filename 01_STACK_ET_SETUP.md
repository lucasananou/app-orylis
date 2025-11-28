# 01 · Stack & Setup (Railway + Vercel)

## Pourquoi ce choix
- **Next.js 15**: App Router, Server Actions, performances.
- **Auth.js** (ex NextAuth): **lien magique** (Email) + adaptateurs matures. Fonctionne très bien avec Postgres.
- **Drizzle ORM**: SQL-first, migrations claires, parfait pour Postgres, typage strict.
- **Railway PostgreSQL**: DB managée simple et rapide.
- **Tailwind + shadcn/ui**: UI propre, rapide à shipper.
- **Resend**: envoi d’emails (lien magique, notifications).

## Provisioning
### Railway (Postgres)
1. Crée un nouveau **Project** → **Add Plugin** → **PostgreSQL**.
2. Récupère `DATABASE_URL` (format `postgresql://user:pass@host:port/db`).
3. Active des backups si nécessaire.

### Vercel (app Next.js)
1. Nouveau projet → import repository GitHub → configure **ENV** (voir `08_ENV_VARS_ET_SECRETS.md`).
2. Build Command par défaut (Next.js).

### Resend
- Crée une API Key, configure un domaine d’envoi si possible (DKIM/SPF).

## Paquets NPM (suggestion)
```bash
# App scaffold
npx create-next-app@latest app-orylis --ts --eslint --src-dir=false --app --tailwind
cd app-orylis

# UI
pnpm i tailwind-merge clsx lucide-react sonner
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button input textarea select card badge label form toast progress dialog sheet dropdown-menu avatar breadcrumb badge

# Auth + ORM + validation
pnpm i next-auth @auth/drizzle-adapter drizzle-orm pg zod react-hook-form @hookform/resolvers
pnpm i -D drizzle-kit

# (Optionnel) upload
pnpm i uploadthing @uploadthing/react  # ou vercel-blob, r2-s3, etc.
```

## Drizzle Config (exemple)
- Déclare un `drizzle.config.ts` pointant vers `DATABASE_URL`.
- Les schémas Drizzle doivent refléter **03_DB_SCHEMA_SQL.md** (ou importe ce SQL via migrations).

