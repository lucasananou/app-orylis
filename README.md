# Orylis Hub – MVP

Espace client Next.js 15 (App Router) prêt pour déploiement sur Vercel et base de données PostgreSQL sur Railway.

## Stack

- **Next.js 15** (App Router, TypeScript strict)
- **Auth.js / NextAuth** (magic link email via Resend, Drizzle adapter)
- **Drizzle ORM** + Railway PostgreSQL
- **Tailwind CSS** + **shadcn/ui** + **lucide-react**
- **React Hook Form** + **Zod**
- **Sonner** pour les notifications
- **Vercel Blob** pour le stockage de fichiers (upload signé)

## Démarrage local

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Le projet est accessible sur [http://localhost:3000](http://localhost:3000).

## Variables d’environnement

Copiez `.env.example` vers `.env.local` et renseignez vos secrets :

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
DATABASE_URL=postgresql://user:pass@host:5432/db
RESEND_API_KEY=changeme
EMAIL_FROM=no-reply@app.orylis.fr
BLOB_READ_WRITE_TOKEN=changeme
BLOB_PUBLIC_URL=https://your-bucket-id.public.blob.vercel-storage.com
```

- `DATABASE_URL` est fourni par Railway (onglet **Connect**).
- `RESEND_API_KEY` : clé API Resend (Dashboard → API Keys).
- `EMAIL_FROM` : adresse d’envoi validée sur Resend.
- `BLOB_READ_WRITE_TOKEN` : token généré depuis `vercel blob tokens create` pour autoriser les uploads.
- `BLOB_PUBLIC_URL` : URL publique de votre bucket Vercel Blob (fournie par `vercel blob ls`).

Pour Vercel, définissez ces mêmes valeurs dans l’onglet **Environment Variables** du projet.

## Base de données & migrations

Drizzle est configuré pour cibler Railway :

- Schémas définis dans `lib/schema.ts`
- Config CLI : `drizzle.config.ts`
- Migrations générées dans `drizzle/`

Commandes utiles :

```bash
pnpm db:generate   # génère les migrations à partir du schéma
pnpm db:migrate    # applique les migrations sur la base ciblée
```

## Authentification

- Email magic link via Resend (`next-auth` EmailProvider)
- Adapter Drizzle pour persister `users`, `sessions`, `verification_tokens`
- Table `profiles` (RBAC `client` / `staff`) créée automatiquement au sign-in
- Session JWT enrichie avec `user.id` et `role`

## UI & Access

- Segment `(dashboard)` protégé côté serveur (`redirect /login` si non connecté)
- Layout premium : sidebar, header avec breadcrumb, placeholders élégants conformes à `10_DESIGN_SYSTEM.md`
- Pages disponibles : dashboard, onboarding, tickets (liste + création), fichiers, facturation, profil

## Déploiement

1. **Railway** : créer une base PostgreSQL → récupérer `DATABASE_URL`.
2. **Resend** : valider domaine & clé API.
3. **Vercel** :
   - Créer le projet depuis ce repo.
   - Ajouter les variables d’environnement.
   - Déployer (`pnpm build` est exécuté par Vercel).
4. Exécuter les migrations depuis Vercel ou localement (avec `DATABASE_URL` de Railway).

## Tests manuels

1. `pnpm dev` → vérifier que l’application démarre sans erreur.
2. Accéder à `/login`, saisir un email → un lien est loggué (si RESEND non configuré) ou envoyé.
3. Suivre le lien de connexion → redirection vers `/` avec session contenant `userId` + `role`.
4. Contrôler l’accès : `/` autorisé connecté, redirigé sinon ; `/tickets`, `/files`, `/billing`, `/profile` idem.
5. Sur `/files`, uploader un document (≤10 Mo), télécharger via le lien signé puis supprimer le fichier.
6. Sur `/dashboard`, vérifier les cartes projets (progress bars dynamiques, badge client pour le staff).

---

> MVP stable pour Prompt 1 — la persistance avancée et les providers de stockage arriveront dans les prompts suivants.

