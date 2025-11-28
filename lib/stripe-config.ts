export const STRIPE_CONFIG = {
    plans: {
        seo: [
            {
                id: "price_1SUihEDmuUuPWn47dbLKS4MD",
                name: "SEO Starter",
                price: 149,
                interval: "month",
                features: ["Audit technique", "Optimisation on-page", "Suivi mensuel"]
            },
            {
                id: "price_1SYL4vDmuUuPWn477HfkHflf",
                name: "SEO Pro",
                price: 249,
                interval: "month",
                features: ["Tout Starter", "Création de contenu", "Netlinking basique"]
            },
            {
                id: "price_1SYL5XDmuUuPWn47DaDurcVh",
                name: "SEO Authority",
                price: 499,
                interval: "month",
                features: ["Tout Pro", "Netlinking avancé", "Stratégie éditoriale complète"]
            }
        ],
        maintenance: [
            {
                id: "price_1SCy2UDmuUuPWn47BIBNFUfP",
                name: "Maintenance Essentielle",
                price: 29,
                interval: "month",
                features: ["Mises à jour", "Sauvegardes quotidiennes", "Sécurité"]
            },
            {
                id: "price_1SYL7CDmuUuPWn47C9Hbtx9H",
                name: "Maintenance Sérénité",
                price: 59,
                interval: "month",
                features: ["Tout Essentielle", "Modifications mineures", "Support prioritaire"]
            },
            {
                id: "price_1SYL7pDmuUuPWn47pZN0LZ9w",
                name: "Maintenance Performance",
                price: 129,
                interval: "month",
                features: ["Tout Sérénité", "Optimisation vitesse", "Rapport mensuel détaillé"]
            }
        ],
        blog: [
            {
                id: "price_1SYL9ADmuUuPWn47475ZNzpV",
                name: "Articles Starter",
                price: 99,
                interval: "month",
                features: ["1 article / mois", "Optimisé SEO", "Intégration incluse"]
            },
            {
                id: "price_1SYL9cDmuUuPWn472tmNpXPQ",
                name: "Articles Pro",
                price: 249,
                interval: "month",
                features: ["3 articles / mois", "Recherche de mots-clés", "Partage réseaux sociaux"]
            },
            {
                id: "price_1SYLA6DmuUuPWn47xz2APzEQ",
                name: "Articles Authority",
                price: 499,
                interval: "month",
                features: ["6 articles / mois", "Stratégie de contenu", "Cluster sémantique"]
            }
        ]
    }
};

export const DEPOSIT_PRICE_ID = "price_1SHgV0DmuUuPWn47voeXABRu";
