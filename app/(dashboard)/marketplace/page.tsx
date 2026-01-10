"use client";

import { ServiceCard } from "@/components/marketplace/service-card";
import { PageHeader } from "@/components/page-header";
import { createCheckoutSession } from "@/actions/stripe";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Zap, PenTool, LayoutTemplate } from "lucide-react";

interface ServiceProps {
    title: string;
    description: string;
    price: string;
    amount: number;
    features: string[];
    popular?: boolean;
    category: string;
}

const SERVICES: ServiceProps[] = [
    // SEO & Visibilité
    {
        title: "Audit SEO Technique",
        description: "Analyse approfondie de votre site : bloquants techniques, structure, et opportunités manquées.",
        price: "190€",
        amount: 190,
        features: ["Analyse Technique & Crawl", "Opportunités Sémantiques", "Analyse Concurrence", "Plan d'action priorisé"],
        category: "seo",
        popular: true
    },
    {
        title: "Pack Netlinking Starter",
        description: "Boostez votre autorité avec 3 liens de qualité vers votre site.",
        price: "180€",
        amount: 180,
        features: ["3 Backlinks thématiques", "Articles invités rédigés", "Ancre optimisée", "Indexation garantie"],
        category: "seo"
    },
    {
        title: "Optimisation Google Business",
        description: "Dominez la recherche locale avec une fiche GMB parfaitement paramétrée.",
        price: "120€",
        amount: 120,
        features: ["Rédaction description optimisée", "Catégories & Services", "Optimisation images", "Réponses aux avis types"],
        category: "seo"
    },

    // A la carte / Contenu
    {
        title: "Article Blog Premium",
        description: "Un article de 1000 mots rédigé par un expert pour se positionner sur Google.",
        price: "60€",
        amount: 60,
        features: ["1000 mots", "Optimisation SEO (SurferSEO)", "Recherche iconographique", "Intégration CMS"],
        category: "content"
    },
    {
        title: "Copywriting Page Vente",
        description: "Transformez vos visiteurs en clients avec une page de vente persuasive.",
        price: "350€",
        amount: 350,
        features: ["Structure AIDA/PAS", "Wording percutant", "Maquettes UX simples", "2 Révisions"],
        category: "content",
        popular: true
    },

    // Technique
    {
        title: "Optimisation Vitesse Max",
        description: "Accélérez drastiquement votre site pour plaire à Google et vos utilisateurs.",
        price: "150€",
        amount: 150,
        features: ["Score Mobile > 80", "Optimisation images (WebP)", "Mise en cache avancée", "Nettoyage scripts"],
        category: "tech"
    },
    {
        title: "Intervention Debug (1h)",
        description: "Un bug, un affichage cassé ou un petit réglage ? On répare ça.",
        price: "90€",
        amount: 90,
        features: ["Diagnostic rapide", "Correction immédiate", "Rapport d'intervention", "Conseils prévention"],
        category: "tech"
    }
];

export default function MarketplacePage() {
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState("all");

    const handleOrder = (serviceTitle: string, amount: number) => {
        startTransition(async () => {
            try {
                await createCheckoutSession(amount, serviceTitle);
                toast.success("Redirection vers le paiement...");
            } catch (error) {
                toast.error("Une erreur est survenue lors de la redirection vers le paiement.");
                console.error(error);
            }
        });
    };

    const filteredServices = activeTab === "all"
        ? SERVICES
        : SERVICES.filter(s => s.category === activeTab);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Marketplace"
                description="Des services à la carte pour accélérer votre croissance ponctuellement."
            />

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
                    <TabsTrigger value="all">Tout voir</TabsTrigger>
                    <TabsTrigger value="seo" className="flex gap-2"><Rocket className="w-4 h-4" /> SEO</TabsTrigger>
                    <TabsTrigger value="content" className="flex gap-2"><PenTool className="w-4 h-4" /> Contenu</TabsTrigger>
                    <TabsTrigger value="tech" className="flex gap-2"><Zap className="w-4 h-4" /> Tech</TabsTrigger>
                </TabsList>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => (
                        <ServiceCard
                            key={service.title}
                            {...service}
                            onCtaClick={() => handleOrder(service.title, service.amount)}
                            isLoading={isPending}
                        />
                    ))}
                </div>
            </Tabs>

            <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/50 to-muted/10 p-8 text-center mt-12">
                <h3 className="mb-2 text-lg font-semibold">Une demande spécifique ?</h3>
                <p className="mb-4 text-muted-foreground w-full md:w-2/3 mx-auto">
                    Nous pouvons réaliser des développements sur mesure (API, Apps, Designs complexes) pour votre activité.
                </p>
                <a
                    href="mailto:contact@orylis.fr?subject=Demande sur mesure"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    Contactez-nous pour un devis
                </a>
            </div>
        </div>
    );
}
