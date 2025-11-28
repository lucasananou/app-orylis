# 11 · RLS optionnel (PostgreSQL pur, sans Supabase)

> **V1**: applique le contrôle d'accès **au niveau applicatif** (handlers API).  
> **Option avancée**: RLS Postgres en utilisant `current_setting('app.user_id', true)`.

## Principe
- Avant chaque requête SQL (dans un middleware DB), exécuter:
  ```sql
  select set_config('app.user_id', '<UUID_USER>', false);
  select set_config('app.user_role', '<ROLE>', false);
  ```
- Activer RLS et écrire des policies basées sur ces settings via des vues ou functions.
- **Attention**: nécessite d'utiliser des **SECURITY DEFINER** functions pour contrôler l'accès.

> Complexe mais ultra sécurisé. À réserver pour V2+.
