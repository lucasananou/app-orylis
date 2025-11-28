# 05 · Routes API (contrats)

> Toutes les routes exigent une session valide (sauf `/api/auth/...`).  
> Réponses JSON, erreurs structurées `{ error: { code, message } }`.

## `/api/onboarding` (POST)
- Body: `{ projectId: string, payload: any, completed?: boolean }`
- Auth: `client` doit être **owner** du projet.
- Effet: upsert `onboarding_responses` pour `project_id`.

## `/api/tickets` (GET, POST)
- **GET**: query `projectId?`
  - `client`: renvoie tickets de **ses** projets
  - `staff`: peut filtrer par `projectId` sinon tous
- **POST**: `{ projectId, title, description }`
  - `author_id` = session user

## `/api/tickets/[id]` (GET, PATCH)
- **GET**: visible si user a accès au projet lié
- **PATCH**: `{ status?: 'open'|'in_progress'|'done', title?, description? }`
  - `client`: peut éditer **son** ticket (idéalement titre/description avant triage)
  - `staff`: peut changer `status` et éditer

## `/api/files/signed-url` (POST)
- Body: `{ projectId, filename, type }`
- Retourne une URL d’upload (selon provider) + `path` cible pour métadonnées `files`.
- En V1, autoriser le `client` owner + `staff`.

## `/api/webhooks/make` (POST)
- Entrée libre (définie côté Make).
- Exemples: création d'un `project`, push d'un `ticket`, mise à jour `progress`.

## `/api/webhooks/stripe` (POST)
- Vérifier signature Stripe.
- Événements utiles: `checkout.session.completed`, `invoice.payment_succeeded`, etc.
- Effets possibles: création `project` + `billing_links` (URL vers facture).
