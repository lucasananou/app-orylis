"use client";

import { ServiceCard } from "@/components/marketplace/service-card";
import { PageHeader } from "@/components/page-header";
import { createCheckoutSession } from "@/actions/stripe";
import { useTransition } from "react";
import { toast } from "sonner";

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
        amount: 50,
        popular: false
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
        amount: 150,
        popular: false
    }
];

export default function MarketplacePage() {
    const [isPending, startTransition] = useTransition();

    const handleOrder = (serviceTitle: string, amount: number) => {
        startTransition(async () => {
            try {
                await createCheckoutSession(amount, serviceTitle);
            } catch (error) {
                toast.error("Une erreur est survenue lors de la redirection vers le paiement.");
                console.error(error);
            }
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Marketplace"
                description="Débloquez tout le potentiel de votre site avec nos services à la carte."
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((service) => (
                    <ServiceCard
                        key={service.title}
                        {...service}
                        onCtaClick={() => handleOrder(service.title, service.amount)}
                        isLoading={isPending}
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
