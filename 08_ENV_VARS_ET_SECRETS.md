# 08 · ENV Vars & Secrets

## Vercel (Next.js)
- `NEXTAUTH_URL=https://app.orylis.fr`
- `NEXTAUTH_SECRET=...` (générer)
- `DATABASE_URL=postgresql://...` (Railway)
- `RESEND_API_KEY=...`
- `EMAIL_FROM=no-reply@app.orylis.fr` (ou autre domaine validé)
- (Upload) `BLOB_READ_WRITE_TOKEN=...` ou credentials S3/R2/UploadThing

## Railway (Postgres)
- Rien d'autre à faire, mais sécuriser les IPs si besoin (Vercel egress).

## Notes
- Ne jamais exposer `DATABASE_URL` côté client.
