# 07 · Webhooks (Make & Stripe)

## Make → `/api/webhooks/make`
Utilisations courantes :
- Créer un `project` (si vente hors Stripe)
- Pousser une note interne (non stockée V1)
- Mettre à jour `projects.progress` ou `status`

**Payload exemple (proposition)**
```json
{
  "type": "project.create",
  "data": {
    "owner_email": "client@ex.com",
    "name": "Site vitrine Boucherie Martin",
    "due_date": "2025-12-01"
  }
}
```

## Stripe → `/api/webhooks/stripe`
- Configurer endpoint dans Stripe (événements `checkout.session.completed`, `invoice.payment_succeeded`, ...).
- À `checkout.session.completed` :
  - Identifier `customer_email` → créer (ou récupérer) `user` + `profiles` (`role='client'`).
  - Créer `project` `{ owner_id, name: "Projet Orylis - <client>", status: 'onboarding' }`.
  - Envoyer mail de bienvenue (Resend) avec lien vers app.
