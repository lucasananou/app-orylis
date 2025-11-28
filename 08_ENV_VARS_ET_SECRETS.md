# 08 · ENV Vars & Secrets

## Vercel (Next.js)
- `NEXTAUTH_URL=https://app.orylis.fr`
- `NEXTAUTH_SECRET=...` (générer)
- `DATABASE_URL=postgresql://...` (Railway)
- `RESEND_API_KEY=...`
- `EMAIL_FROM=noreply@orylis.fr` (ou autre domaine validé)
- `BLOB_READ_WRITE_TOKEN=...` (obligatoire pour l'upload de fichiers)

### Comment obtenir BLOB_READ_WRITE_TOKEN

1. **Via Vercel CLI** (recommandé) :
   ```bash
   vercel blob tokens create
   ```
   Cela génère un token que vous pouvez copier dans les variables d'environnement Vercel.

2. **Via Vercel Dashboard** :
   - Allez dans votre projet Vercel
   - Settings → Storage → Blob
   - Créez un nouveau token avec les permissions "Read & Write"

3. **Note** : Si vous déployez sur Vercel, le token peut être automatiquement détecté dans certains cas, mais il est recommandé de le définir explicitement.

## Railway (Postgres)
- Rien d'autre à faire, mais sécuriser les IPs si besoin (Vercel egress).

## Notes
- Ne jamais exposer `DATABASE_URL` côté client.
- `BLOB_READ_WRITE_TOKEN` est requis pour l'upload de fichiers. Sans ce token, les uploads échoueront avec une erreur claire.
