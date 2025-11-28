# ⚡ Optimisations Techniques Prioritaires

## 📊 Résumé exécutif

**Impact estimé :**
- 🔴 **Haute priorité** : Gain de performance >30%, impact utilisateur immédiat
- 🟡 **Moyenne priorité** : Gain 10-30%, amélioration continue
- 🟢 **Basse priorité** : Gain <10%, optimisations avancées

---

## 🔴 HAUTE PRIORITÉ - Impact immédiat

### 1. **Optimisation du cache Next.js**
**Problème actuel :** 
- Dashboard utilise `force-dynamic` + `revalidate = 0` → pas de cache du tout
- Toutes les pages rechargent à chaque requête
- Impact : latence élevée, charge DB inutile

**Solution :**
```typescript
// Au lieu de :
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Utiliser :
export const revalidate = 30; // Cache 30 secondes pour données qui changent peu
// ou
export const revalidate = 60; // Pour données plus statiques
```

**Pages à optimiser :**
- `/dashboard` : `revalidate = 30` (projets changent peu)
- `/tickets` : Déjà à `revalidate = 10` ✅
- `/files` : Déjà à `revalidate = 20` ✅
- `/admin/quotes` : Ajouter `revalidate = 60`
- `/admin/clients` : Ajouter `revalidate = 60`

**Impact :** -50% de temps de chargement, -70% de requêtes DB

### 2. **Lazy loading des composants lourds**
**Problème actuel :** Tous les composants sont chargés en même temps

**Solution :**
```typescript
// Composants à lazy load :
const QuoteViewer = dynamic(() => import("@/components/quote/quote-viewer"), {
  loading: () => <QuoteViewerSkeleton />,
  ssr: false // PDF viewer n'a pas besoin de SSR
});

const OnboardingForm = dynamic(() => import("@/components/form/onboarding-form"), {
  loading: () => <OnboardingFormSkeleton />
});

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false
});
```

**Composants prioritaires :**
- `QuoteViewer` (PDF viewer lourd)
- `OnboardingForm` (formulaire complexe)
- `ChatWidget` (script externe)
- `EmailTemplatesEditor` (admin seulement)

**Impact :** -40% de bundle initial, +30% de First Contentful Paint

### 3. **Skeleton loaders au lieu de spinners**
**Problème actuel :** Spinners génériques, pas de feedback visuel structuré

**Solution :**
- Créer des composants `*Skeleton` pour chaque page
- Remplacer `Loader2` par des skeletons contextuels
- Améliorer la perception de performance

**Pages prioritaires :**
- Dashboard skeleton
- Tickets list skeleton
- Files grid skeleton
- Quote viewer skeleton

**Impact :** +50% de perception de vitesse, meilleure UX

### 4. **Optimisation des requêtes DB avec jointures**
**Problème actuel :** Requêtes multiples au lieu de jointures efficaces

**Exemple actuel (dashboard) :**
```typescript
// Charger projets et owners séparément
const [projectRows, rawOwners] = await Promise.all([...]);
// Puis mapper manuellement
```

**Solution optimisée :**
```typescript
// Une seule requête avec jointure
const projectRows = await db
  .select({
    id: projects.id,
    name: projects.name,
    ownerName: profiles.fullName, // Directement dans la requête
    // ...
  })
  .from(projects)
  .leftJoin(profiles, eq(projects.ownerId, profiles.id));
```

**Endroits à optimiser :**
- Dashboard : projets + owners
- Tickets : tickets + projets + auteurs
- Files : files + projets
- Admin quotes : quotes + projets + profiles

**Impact :** -60% de requêtes DB, -40% de temps de réponse

### 5. **Prefetching intelligent des liens**
**Problème actuel :** Pas de prefetching, navigation lente

**Solution :**
```typescript
// Dans la sidebar et navigation
<Link href="/tickets" prefetch={true}>
  Tickets
</Link>

// Prefetch conditionnel pour les pages probables
<Link href="/quote/[id]" prefetch={user.isProspect}>
  Voir devis
</Link>
```

**Impact :** -50% de temps de navigation perçu

---

## 🟡 MOYENNE PRIORITÉ - Amélioration continue

### 6. **Optimisation des images**
**Problème actuel :** Images non optimisées, pas de lazy loading

**Solution :**
```typescript
// Utiliser Next.js Image partout
<Image
  src={logoUrl}
  alt="Logo"
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

**Impact :** -30% de poids des pages, meilleur LCP

### 7. **Code splitting par route**
**Problème actuel :** Bundle monolithique

**Solution :**
- Vérifier que Next.js fait déjà du code splitting automatique
- S'assurer que les routes admin ne chargent pas les composants client
- Analyser le bundle avec `@next/bundle-analyzer`

**Impact :** -20% de bundle initial

### 8. **Optimisation des requêtes API**
**Problème actuel :** Appels API séquentiels au lieu de parallèles

**Solution :**
```typescript
// Au lieu de :
const quotes = await loadQuotes();
const projects = await loadProjects();

// Utiliser :
const [quotes, projects] = await Promise.all([
  loadQuotes(),
  loadProjects()
]);
```

**Impact :** -40% de temps de chargement des pages complexes

### 9. **Index de base de données**
**Problème actuel :** Index manquants potentiels

**Vérifier les index sur :**
- `projects.owner_id` (déjà présent ✅)
- `projects.status` (déjà présent ✅)
- `tickets.project_id` (à vérifier)
- `tickets.status` (à vérifier)
- `files.project_id` (à vérifier)
- `quotes.project_id` (déjà présent ✅)
- `quotes.status` (déjà présent ✅)

**Impact :** -50% de temps de requêtes sur grandes tables

### 10. **Compression et minification**
**Vérifier :**
- Gzip/Brotli activé sur Vercel ✅ (automatique)
- Minification CSS/JS ✅ (automatique)
- Tree shaking ✅ (automatique avec Next.js)

**Impact :** Déjà optimisé ✅

---

## 🟢 BASSE PRIORITÉ - Optimisations avancées

### 11. **Service Worker pour cache offline**
**Solution :** PWA avec cache stratégique
**Impact :** Meilleure expérience offline, mais complexité ajoutée

### 12. **HTTP/2 Server Push**
**Solution :** Push des assets critiques
**Impact :** -10% de temps de chargement, mais complexité

### 13. **Database connection pooling avancé**
**Solution :** Pooling adaptatif selon la charge
**Impact :** Meilleure gestion des pics, mais déjà bien configuré ✅

### 14. **CDN pour assets statiques**
**Solution :** Vercel Edge Network (déjà activé ✅)
**Impact :** Déjà optimisé ✅

### 15. **Monitoring et analytics de performance**
**Solution :**
- Vercel Analytics ✅ (déjà présent)
- Web Vitals tracking
- Error tracking (Sentry)
- Performance budgets

**Impact :** Meilleure visibilité, optimisation continue

---

## 🎯 Plan d'action recommandé (ordre d'implémentation)

### Sprint 1 (1 semaine) - Quick wins performance
1. ✅ Optimiser le cache du dashboard (`revalidate = 30`)
2. ✅ Lazy load `QuoteViewer` et `ChatWidget`
3. ✅ Créer skeleton loaders pour dashboard et tickets
4. ✅ Optimiser requêtes DB avec jointures (dashboard)

### Sprint 2 (1-2 semaines) - Optimisations majeures
5. ✅ Lazy load tous les composants lourds
6. ✅ Optimiser toutes les requêtes DB avec jointures
7. ✅ Ajouter prefetching intelligent
8. ✅ Vérifier et ajouter index DB manquants

### Sprint 3 (2 semaines) - Optimisations avancées
9. ✅ Optimiser toutes les images
10. ✅ Analyser et optimiser le bundle size
11. ✅ Monitoring performance complet
12. ✅ Tests de charge et optimisation continue

---

## 📈 Métriques à suivre

**Performance :**
- First Contentful Paint (FCP) : < 1.5s
- Largest Contentful Paint (LCP) : < 2.5s
- Time to Interactive (TTI) : < 3.5s
- Total Blocking Time (TBT) : < 200ms
- Cumulative Layout Shift (CLS) : < 0.1

**Bundle :**
- Bundle initial : < 200 KB (gzipped)
- Total bundle : < 500 KB (gzipped)

**Base de données :**
- Temps moyen de requête : < 50ms
- Nombre de requêtes par page : < 5

**Réseau :**
- Temps de chargement page : < 1s (3G)
- Temps de navigation : < 300ms

---

## 💡 Notes techniques

### Cache Strategy
```typescript
// Pages statiques (rarement modifiées)
export const revalidate = 3600; // 1 heure

// Pages semi-dynamiques (modifiées occasionnellement)
export const revalidate = 60; // 1 minute

// Pages dynamiques (modifiées souvent)
export const revalidate = 10; // 10 secondes

// Pages très dynamiques (temps réel)
export const dynamic = "force-dynamic";
```

### Lazy Loading Pattern
```typescript
// Composant client lourd
const HeavyComponent = dynamic(
  () => import("@/components/heavy-component"),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false // Si pas besoin de SSR
  }
);

// Route entière (si nécessaire)
const AdminPage = dynamic(() => import("@/app/admin/page"), {
  loading: () => <PageSkeleton />
});
```

### DB Query Optimization
```typescript
// ❌ Mauvais : Requêtes multiples
const projects = await db.select().from(projects);
const owners = await Promise.all(
  projects.map(p => db.query.profiles.findFirst({ where: eq(profiles.id, p.ownerId) }))
);

// ✅ Bon : Jointure unique
const projectsWithOwners = await db
  .select({
    project: projects,
    owner: profiles
  })
  .from(projects)
  .leftJoin(profiles, eq(projects.ownerId, profiles.id));
```

### Skeleton Component Pattern
```typescript
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔧 Outils recommandés

**Analyse de performance :**
- `@next/bundle-analyzer` - Analyse du bundle
- Lighthouse CI - Tests automatisés
- Vercel Analytics - Métriques réelles
- Web Vitals - Core Web Vitals

**Monitoring :**
- Vercel Speed Insights ✅ (déjà présent)
- Sentry (optionnel) - Error tracking
- LogRocket (optionnel) - Session replay

**Optimisation DB :**
- `EXPLAIN ANALYZE` - Analyser les requêtes lentes
- pg_stat_statements - Identifier les requêtes fréquentes
- Index advisor - Suggestions d'index

---

*Document créé le 2025-01-XX - À mettre à jour selon les métriques réelles*

