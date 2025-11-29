"use client";

import { ServiceCard } from "@/components/marketplace/service-card";
import { PageHeader } from "@/components/page-header";

const SERVICES = [
    {
        title: "Rédaction de Contenu",
        description: "Des articles de blog optimisés SEO pour attirer plus de trafic qualifié sur votre site.",
        price: "50€",
        features: [
            "Article de 800 mots",
            "Optimisation mots-clés",
            "Intégration directe",
            "Recherche de sujet"
        ],
        popular: false
    },
    {
        title: "Pack Maintenance +",
        description: "Dormez tranquille. On s'occupe des mises à jour, de la sécurité et des petites modifications.",
        price: "99€",
        features: [
            "Mises à jour plugins/thème",
            "Sauvegardes journalières",
            "Rapport mensuel détaillé",
            "1h de modifications / mois"
        ],
        popular: true
    },
    {
        title: "Audit SEO Complet",
        description: "Une analyse approfondie de votre site pour identifier les bloquants et booster votre visibilité.",
        price: "150€",
        features: [
            "Analyse technique",
            "Analyse de contenu",
            "Analyse des concurrents",
            "Plan d'action priorisé"
        ],
        popular: false
    }
];

export default function MarketplacePage() {
    const handleOrder = (serviceTitle: string) => {
        // For MVP, we can just open a mailto or a generic contact form
        window.location.href = `mailto:contact@orylis.fr?subject=Commande : ${serviceTitle}`;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Marketplace"
                description="Boostez votre site avec nos services à la carte."
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((service) => (
                    <ServiceCard
                        key={service.title}
                        {...service}
                        onCtaClick={() => handleOrder(service.title)}
                    />
                ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/30 p-8 text-center">
                <h3 className="mb-2 text-lg font-semibold">Besoin d'autre chose ?</h3>
                <p className="mb-4 text-muted-foreground">
                    Nous pouvons réaliser des développements sur mesure pour votre activité.
                </p>
                <a
                    href="mailto:contact@orylis.fr?subject=Demande sur mesure"
                    className="text-sm font-medium text-primary hover:underline"
                >
                    Contactez-nous pour un devis gratuit
                </a>
            </div>
        </div>
    );
}
