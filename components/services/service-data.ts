export type ServiceFeature = string;

export interface ServicePack {
    id: string;
    priceId: string;
    title: string;
    price: string;
    description: string;
    features: ServiceFeature[];
    recommended?: boolean;
    color: "green" | "blue" | "purple" | "amber";
}

export interface UpsellItem {
    id: string;
    title: string;
    price: string;
    description: string;
    features: ServiceFeature[];
    type: "one-shot" | "monthly";
}

export const maintenancePacks: ServicePack[] = [
    {
        id: "maintenance-essentiel",
        priceId: "price_1SCy2UDmuUuPWn47BIBNFUfP",
        title: "Pack Maintenance Essentiel",
        price: "29€/mois",
        description: "Pour les sites qui veulent être stables et sécurisés.",
        features: [
            "Mises à jour WP / Thème / Extensions (mensuelles)",
            "Sauvegardes automatiques",
            "Sécurité + Firewall",
            "Surveillance uptime",
            "Corrections en cas de bug",
            "Optimisation performance basique",
            "Support ticket standard",
            "1 rapport d’état mensuel"
        ],
        color: "green"
    },
    {
        id: "maintenance-premium",
        priceId: "price_1SYL7CDmuUuPWn47C9Hbtx9H",
        title: "Pack Maintenance Premium",
        price: "59€/mois",
        description: "Ton offre “standard” = celle que tout le monde devrait prendre.",
        features: [
            "Mises à jour hebdomadaires",
            "Maintenance performance (cache + DB + optimisation images)",
            "Dispositif sécurité avancé",
            "Plugins premium Orylis inclus (valeur +290€/an)",
            "Monitoring pro (temps de réponse + erreurs)",
            "Support prioritaire",
            "1 correctif urgent / mois",
            "Rapport mensuel complet"
        ],
        recommended: true,
        color: "blue"
    },
    {
        id: "maintenance-serenite",
        priceId: "price_1SYL7pDmuUuPWn47pZN0LZ9w",
        title: "Pack Maintenance Sérénité",
        price: "129€/mois",
        description: "Pour les clients qui veulent zéro stress + accompagnement.",
        features: [
            "Tout du Premium",
            "Interventions illimitées sur le site (petites modifs)",
            "Assistance sous 2h",
            "Audit UX + performance trimestriel",
            "Améliorations mensuelles proactives",
            "Réunions stratégiques trimestrielles",
            "Sauvegardes redondantes (double stockage)"
        ],
        color: "purple"
    }
];

export const seoPacks: ServicePack[] = [
    {
        id: "seo-essentiel",
        priceId: "price_1SUihEDmuUuPWn47dbLKS4MD",
        title: "SEO Essentiel",
        price: "149€/mois",
        description: "Pour poser les bases et commencer à remonter.",
        features: [
            "Audit SEO initial",
            "1 optimisation technique/mois",
            "1 page optimisée/mois",
            "1 mini-rapport",
            "Recommandations personnalisées"
        ],
        color: "green"
    },
    {
        id: "seo-avance",
        priceId: "price_1SYL4vDmuUuPWn477HfkHflf",
        title: "SEO Avancé",
        price: "249€/mois",
        description: "Pour développer le trafic avec un vrai rythme.",
        features: [
            "2 optimisations techniques/mois",
            "2 pages optimisées/mois",
            "1 article SEO/mois (500–800 mots)",
            "Netlinking light",
            "Rapport mensuel détaillé",
            "Recommandations + plan d’action"
        ],
        recommended: true,
        color: "blue"
    },
    {
        id: "seo-dominant",
        priceId: "price_1SYL5XDmuUuPWn47DaDurcVh",
        title: "SEO Dominant",
        price: "499€/mois",
        description: "Pour ceux qui veulent exploser la SERP.",
        features: [
            "4 optimisations techniques/mois",
            "4 pages optimisées/mois",
            "4 articles SEO/mois",
            "Netlinking premium",
            "Audit complet trimestriel",
            "Plan d'action SEO continu",
            "Analyse concurrentielle"
        ],
        color: "purple"
    }
];

export const blogPacks: ServicePack[] = [
    {
        id: "articles-starter",
        priceId: "price_1SYL9ADmuUuPWn47475ZNzpV",
        title: "Pack Articles Starter",
        price: "99€/mois",
        description: "1 article / mois — 800 mots",
        features: [
            "Recherches mots-clés",
            "Structure SEO optimisée",
            "Ton adapté",
            "Publication incluse"
        ],
        color: "green"
    },
    {
        id: "articles-pro",
        priceId: "price_1SYL9cDmuUuPWn472tmNpXPQ",
        title: "Pack Articles Pro",
        price: "249€/mois",
        description: "4 articles / mois — 800 à 1200 mots",
        features: [
            "Recherche sémantique approfondie",
            "Optimisation SEO complète",
            "Idéation + calendrier éditorial",
            "Publication + design visuel basique"
        ],
        recommended: true,
        color: "blue"
    },
    {
        id: "articles-authority",
        priceId: "price_1SYLA6DmuUuPWn47xz2APzEQ",
        title: "Pack Articles Authority",
        price: "499€/mois",
        description: "8 articles / mois — 1000 à 1500 mots",
        features: [
            "Cluster thématique",
            "Optimisation SEO avancée",
            "Intégration images optimisées",
            "Interlinking intelligent",
            "Publication + mise en forme premium"
        ],
        color: "purple"
    }
];

export const upsellItems: UpsellItem[] = [
    {
        id: "speed-boost",
        title: "Accélérateur de vitesse",
        price: "149€",
        type: "one-shot",
        description: "Score SpeedBoost : +20 à +40%",
        features: [
            "Optimisation Core Web Vitals",
            "Nettoyage / Compression images",
            "Optimisation JS / CSS"
        ]
    },
    {
        id: "security-advanced",
        title: "Sécurité Avancée",
        price: "99€/mois",
        type: "monthly",
        description: "Protection maximale contre les attaques.",
        features: [
            "Monitoring 24/7",
            "Système anti-bot / DDoS",
            "Scan quotidien",
            "Restauration en 1 clic",
            "Hardening serveur"
        ]
    },
    {
        id: "audit-ux",
        title: "Audit UX & Conversion",
        price: "199€",
        type: "one-shot",
        description: "Boostez vos conversions.",
        features: [
            "Analyse page par page",
            "Heatmap & scrollmap (si dispo)",
            "Recommandations concrètes",
            "Priorisation rapide"
        ]
    },
    {
        id: "ab-testing",
        title: "A/B Testing Pro",
        price: "49€/mois",
        type: "monthly",
        description: "Testez et optimisez en continu.",
        features: [
            "1 test / mois",
            "Setup complet",
            "Rapport clair",
            "Reco actionnable"
        ]
    },
    {
        id: "ecommerce-boost",
        title: "Pack E-commerce Boost",
        price: "299€",
        type: "one-shot",
        description: "Augmentation panier moyen.",
        features: [
            "Optimisation fiche produit",
            "Tunnel de commande",
            "Upsell + Cross-sell",
            "AB test panier"
        ]
    }
];
