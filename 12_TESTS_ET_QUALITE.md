# 12 · Tests & Qualité

## Ce qui compte pour V1
- **Contracts d'API** testés (Unit + e2e minimal avec Thunder Client/Insomnia)
- **Validation Zod** sur toutes les entrées
- **Protection auth** (403 si pas owner/ni staff)

## Idées rapides
- Tests de handler avec `vitest` (optionnel V1)
- Lint strict + typecheck CI
