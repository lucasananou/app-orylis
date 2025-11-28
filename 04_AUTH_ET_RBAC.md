# 04 · Auth & RBAC (Auth.js + Drizzle)

## Auth — Lien magique (Email)
- Provider: **EmailProvider (Resend)**.
- Stratégie **JWT**.
- Adapter: **@auth/drizzle-adapter** (tables users/accounts/sessions/verification_tokens).
- Après login, vérifier/compléter `profiles.role` (par défaut `client`).

## RBAC minimal
- **Rôles**: `client` (par défaut), `staff`.
- **Règle**: un `client` ne peut voir **que** ses projets & données liées. `staff` voit tout.
- **Enforcement**: **côté serveur** dans les handlers `/api/*` en joignant la session user → `userId` → `profiles.role`.

## Mapping session → profile
- À chaque requête API : récupère `session`, join `profiles` (par `profiles.id = users.id`), vérifie `role`.
- Expose un helper `getSessionUser()` dans `/lib/auth.ts` retournant `{ userId, role }`.

## Création de profil
- **Hook post-signin** : si `profiles` n'a pas de ligne pour `user.id`, en créer une avec `role='client'`.
