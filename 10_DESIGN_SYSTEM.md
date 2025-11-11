# 10 · Design System (Ultra élégant · Orylis)

## Intentions
- **Simplicité premium** : espaces, respirations, lignes nettes.
- **Hiérarchie claire** : titres sobres, micro-contrastes.
- **Aucune surcharge** : états vides soignés, messages humains.

## Couleurs
- **Accent**: `#43b2b9`
- **Neutres**: gris froids (50–900), fond très clair #F7F9FB, texte #0F172A
- **Feedback**: success/amber/destructive (palette shadcn par défaut)

## Typographie
- Sans serif moderne (Inter, SF, Geist) — titres medium/semibold, corps regular.
- Tracking léger sur grands titres.

## Espacements
- Base 8px — sections p-6 à p-10, cards p-6, listes p-4.

## Composants
- **Cards**: coins arrondis `rounded-2xl`, ombre douce, bordure `border-[0.5px]` quasi imperceptible.
- **Buttons**: taille **md** par défaut, **lg** pour actions primaires.
- **Form Inputs**: hauteur 44px, labels au-dessus, helper text discret.
- **Breadcrumb**: minimal, séparateurs fins.
- **Empty States**: icône lucide, phrase courte, CTA clair.

## Layout
- Sidebar fixe 72px (icon + label), hover amplifié.
- Contenu max-w-6xl, grilles `grid grid-cols-12 gap-6` si nécessaire.

## Micro-interactions
- Transitions `duration-200` sur hover/focus.
- Toasters en haut à droite, discrets.

## Accessibilité
- Contrastes AA, focus visible propre, tailles d’aires cliquables correctes.

## Illustrations (V1)
- Pas d’illustrations lourdes. Préfère de petites icônes linéaires cohérentes.

## Exemples d’états vides
- **Onboarding**: “Aucun formulaire commencé — Commencer l’onboarding”
- **Files**: “Pas encore de fichiers — Charger un premier document”
