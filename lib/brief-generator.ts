import { OnboardingFinalPayload } from "@/lib/zod-schemas";

export function generateBriefContentFromPayload(payload: OnboardingFinalPayload): string {
    const parts: string[] = [];

    // 1. En-tête
    parts.push(`# Cahier des Charges - v1`);
    parts.push(`*Généré automatiquement suite à l'onboarding client*`);
    parts.push("");

    // 2. Identité
    parts.push(`## 1. Identité & Contact`);
    if (payload.fullName) parts.push(`- **Nom du contact** : ${payload.fullName}`);
    if (payload.company) parts.push(`- **Entreprise** : ${payload.company}`);
    if (payload.phone) parts.push(`- **Téléphone** : ${payload.phone}`);
    if (payload.website) parts.push(`- **Site actuel** : ${payload.website}`);
    parts.push("");

    // 3. Objectifs
    parts.push(`## 2. Objectifs du site`);
    if (payload.goals && payload.goals.length > 0) {
        parts.push(`**Objectifs principaux :**`);
        payload.goals.forEach((goal) => parts.push(`- ${goal}`));
    }
    if (payload.description) {
        parts.push("");
        parts.push(`**Description du projet :**`);
        parts.push(payload.description);
    }
    parts.push("");

    // 4. Design & Inspirations
    parts.push(`## 3. Design & Inspirations`);
    if (payload.inspirations && payload.inspirations.length > 0) {
        parts.push(`**Sites de référence :**`);
        payload.inspirations.forEach((site) => parts.push(`- ${site}`));
    }
    if (payload.competitors && payload.competitors.length > 0) {
        parts.push("");
        parts.push(`**Concurrents :**`);
        payload.competitors.forEach((site) => parts.push(`- ${site}`));
    }
    parts.push("");

    // 5. Structure & Contenu
    parts.push(`## 4. Structure du site`);
    if (payload.pages && payload.pages.length > 0) {
        parts.push(`**Pages demandées :**`);
        payload.pages.forEach((page) => parts.push(`- ${page}`));
    }

    if (payload.customPages && payload.customPages.length > 0) {
        parts.push("");
        parts.push(`**Pages sur mesure :**`);
        payload.customPages.forEach((page) => {
            parts.push(`### ${page.title}`);
            if (page.description) parts.push(page.description);
        });
    }

    if (payload.contentsNote) {
        parts.push("");
        parts.push(`**Notes sur le contenu :**`);
        parts.push(payload.contentsNote);
    }
    parts.push("");

    // 6. Technique
    parts.push(`## 5. Technique`);
    parts.push(`- **Domaine existant** : ${payload.domainOwned ? "Oui" : "Non"}`);
    if (payload.domainName) parts.push(`- **Nom de domaine** : ${payload.domainName}`);
    if (payload.hostingNotes) parts.push(`- **Notes hébergement** : ${payload.hostingNotes}`);

    return parts.join("\n");
}
