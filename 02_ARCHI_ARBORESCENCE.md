# 02 · Architecture & Arborescence

## Arborescence proposée
```
/app
  /(auth)/login/page.tsx             # Page de login par email (magic link)
  /(auth)/callback/route.ts          # (si besoin) endpoints de callback
  /(dashboard)/layout.tsx
  /(dashboard)/page.tsx              # Home dashboard
  /(dashboard)/onboarding/page.tsx
  /(dashboard)/tickets/page.tsx
  /(dashboard)/tickets/new/page.tsx
  /(dashboard)/files/page.tsx
  /(dashboard)/billing/page.tsx
  /(dashboard)/profile/page.tsx

  /api/auth/[...nextauth]/route.ts   # Auth.js (App Router)
  /api/webhooks/make/route.ts        # Inbound from Make
  /api/webhooks/stripe/route.ts      # Stripe Webhook
  /api/onboarding/route.ts           # POST onboarding submit
  /api/tickets/route.ts              # GET/POST tickets
  /api/tickets/[id]/route.ts         # GET/PATCH one ticket
  /api/files/signed-url/route.ts     # get upload/download URLs

/components
  ui/* (shadcn)
  navbar.tsx, sidebar.tsx, page-header.tsx, empty-state.tsx
  progress-steps.tsx
  ticket-card.tsx, file-card.tsx
  form/onboarding-form.tsx

/lib
  auth.ts                            # Auth.js config helpers
  db.ts                              # Drizzle pg client
  schema.ts                          # Drizzle schema (Alt: migrations SQL)
  zod-schemas.ts
  utils.ts

/styles
  globals.css
/specs
  (tous les .md)
```

## Flux clés (haut niveau)
- **Auth**: email → magic link → session (JWT) → rôle (client/staff) via table `profiles`.
- **Onboarding**: formulaire enregistrant un `payload jsonb` dans `onboarding_responses` lié à un `project`.
- **Tickets**: CRUD scoped par `project_id` + `author_id`.
- **Fichiers**: métadonnées en DB, stockage externalisé (pré-signés si privé).
- **Billing**: juste des **liens** Stripe/Drive/Notion en V1.
