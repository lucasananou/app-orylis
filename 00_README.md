# Orylis Hub — MVP (Cursor-Ready Brief)
**Date:** 2025-11-11

Ce dépôt contient **uniquement des fichiers `.md`** (spécifications, schémas SQL, checklists, guides) pour livrer **app.orylis.fr – V1** en 1 journée.

> Objectif : un **MVP élégant** pour l'**onboarding client**, le **suivi de projet**, les **demandes de modifs (tickets)**, les **fichiers**, la **facturation (liens)**, et une **auth par lien magique** (email).  
> **Infra** ciblée : **Railway** (PostgreSQL géré) + **Vercel** (Next.js).
> **Attention :** ce brief est une **proposition**, pas une obligation. Adapte librement.

## Modules V1
- Onboarding multi-étapes (formulaire + sauvegarde partielle)
- Dashboard projet (progression, jalons, échéances)
- Tickets (ouvert/en cours/fait)
- Fichiers (métadonnées + upload direct vers storage à définir, ex: Cloudflare R2/S3-like ou Vercel Blob)
- Facturation (liens Stripe / Devis PDF externes / Notion / Google Drive)
- Auth **magic link** par email (Auth.js + Resend)
- Webhooks (Stripe & Make) → mise à jour projet / création client / notifications

## Stack proposée
- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** + **lucide-react**
- **Auth.js (NextAuth)** Email provider (Resend) + **Drizzle ORM** + **PostgreSQL Railway**
- **Zod** + **React Hook Form** + **Sonner** (toasts)
- **Upload** : à choisir (Vercel Blob, Cloudflare R2, UploadThing, ou S3 compatible)
- **Déploiement** : Vercel (app) + Railway (DB)

## Dossiers (proposés)
- `/app` (routes & pages)
- `/components` (UI & formulaires)
- `/lib` (db, auth, utils)
- `/styles` (tailwind/globals)
- `/specs` (ces .md + schémas SQL + docs)

Lis dans l'ordre :  
1. **01_STACK_ET_SETUP.md**  
2. **02_ARCHI_ARBORESCENCE.md**  
3. **03_DB_SCHEMA_SQL.md**  
4. **04_AUTH_ET_RBAC.md**  
5. **05_ROUTES_API.md**  
6. **06_PAGES_ET_FLOWS.md**  
7. **07_WEBHOOKS_MAKE_STRIPE.md**  
8. **08_ENV_VARS_ET_SECRETS.md**  
9. **09_COMMANDES_CHEATSHEET.md**  
10. **10_DESIGN_SYSTEM.md**  
11. **11_RLS_OPTIONNEL.md**  
12. **12_TESTS_ET_QUALITE.md**  
13. **13_SECURITE_CHECKLIST.md**  
14. **14_ROADMAP_V2_V3.md**

---

> Tip: Copie/colle des blocs complets depuis ces fichiers dans Cursor pour générer le code automatiquement.
