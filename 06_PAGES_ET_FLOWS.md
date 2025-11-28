# 06 · Pages & Flows

## Layout
- Sidebar : Dashboard, Onboarding, Tickets, Fichiers, Facturation, Profil
- Header : breadcrumb + actions contextuelles + avatar

## Pages
### `/login`
- Email input → envoi magic link (Resend)
- States (succès/erreur)

### `/dashboard`
- Résumé des projets (cards) + progression + échéances proches
- Empty states si aucun projet
- CTA "Commencer l'onboarding" si `status=onboarding`

### `/onboarding`
- Form multi-étapes (React Hook Form + Zod)
- Autosave (draft) → POST `/api/onboarding`
- Étapes (proposition) :
  1. Coordonnées & entreprise
  2. Objectifs du site
  3. Pages & contenu (textes, images)
  4. Inspirations & concurrents
  5. Technique (domaine, hébergement si déjà existant)
  6. Validation & envoi

### `/tickets`
- Liste des tickets (filters: status)
- Bouton **Nouveau ticket** → `/tickets/new`
- Carte ticket : titre, status, date, auteur

### `/files`
- Grille de fichiers (métadonnées)
- Bouton **Uploader** (ouvre modal → signed URL)
- Affichage label + preview si possible

### `/billing`
- Liste de `billing_links` (Stripe, Notion, PDF Drive)
- CTA: “Payer/voir facture” (ouvre dans un nouvel onglet)

### `/profile`
- `full_name`, `company`, `phone`
- Bouton **Enregistrer**

## Flows
- **Post-paiement Stripe** → webhook → création `project` + email de bienvenue (Resend) avec lien login.
- **Onboarding terminé** → `projects.status` passe à `design` et `progress` augmente.
