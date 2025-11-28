# 13 · Sécurité — Checklist V1

- [ ] `NEXTAUTH_SECRET` fort et stocké en secret
- [ ] Session JWT signée, durée raisonnable (ex: 7j)
- [ ] Validation Zod sur chaque body/query
- [ ] Limites d’upload + filtrage MIME
- [ ] Webhook Stripe vérifié par signature
- [ ] Env non exposées côté client
- [ ] Pages/API protégées par session + rôle
- [ ] Logs d’erreurs sans secrets
