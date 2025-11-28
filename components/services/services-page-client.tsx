"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/services/service-card";
import { maintenancePacks, seoPacks, blogPacks } from "@/components/services/service-data";
import { toast } from "@/components/ui/use-toast";
import { useProjectSelection } from "@/lib/project-selection";
import { useState } from "react";
import { ActiveServices } from "./active-services";

interface Subscription {
    id: string;
    projectId: string;
    serviceType: "seo" | "maintenance" | "blog";
    status: string;
    currentPeriodEnd: Date;
    isManual?: boolean;
}

interface ServicesPageClientProps {
    subscriptions: Subscription[];
}

export function ServicesPageClient({ subscriptions }: ServicesPageClientProps) {
    const { projectId } = useProjectSelection();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const activeSubscriptions = projectId
        ? subscriptions.filter(sub => sub.projectId === projectId)
        : [];

    const handleSelect = async (packId: string) => {
        if (!projectId) {
            toast.error("Veuillez sélectionner un projet d'abord.");
            return;
        }

        // Find the pack to get the priceId
        const allPacks = [...maintenancePacks, ...seoPacks, ...blogPacks];
        const pack = allPacks.find(p => p.id === packId);

        if (!pack || !pack.priceId) {
            toast.error("Offre non disponible pour le moment.");
            return;
        }

        setLoadingId(packId);

        try {
            // Determine service type based on pack ID prefix or category
            let serviceType = "maintenance";
            if (packId.startsWith("seo")) serviceType = "seo";
            if (packId.startsWith("articles")) serviceType = "blog";

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    priceId: pack.priceId,
                    projectId,
                    serviceType
                })
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la création de la session.");
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue. Veuillez réessayer.");
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Mes Services & Offres"
                description="Boostez votre site avec nos packs de maintenance, SEO et contenu."
            />

            <ActiveServices subscriptions={activeSubscriptions} />

            <Tabs defaultValue="maintenance" className="space-y-8">
                <TabsList className="bg-white border border-slate-200 p-1 rounded-full h-auto flex-wrap justify-start">
                    <TabsTrigger value="maintenance" className="rounded-full px-6 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Maintenance & Sécurité
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="rounded-full px-6 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Référencement (SEO)
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="rounded-full px-6 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Rédaction & Blog
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="maintenance" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Gardez votre site performant et sécurisé 🛡️</h2>
                        <p className="text-slate-500 mt-2">
                            Ne laissez pas les bugs ou les pirates ralentir votre business. Nos packs de maintenance vous assurent une tranquillité d'esprit totale.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
                        {maintenancePacks.map((pack) => (
                            <ServiceCard
                                key={pack.id}
                                pack={pack}
                                onSelect={handleSelect}
                                isLoading={loadingId === pack.id}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Dominez les résultats de recherche 🚀</h2>
                        <p className="text-slate-500 mt-2">
                            Augmentez votre visibilité et attirez plus de clients qualifiés grâce à nos stratégies SEO éprouvées.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
                        {seoPacks.map((pack) => (
                            <ServiceCard
                                key={pack.id}
                                pack={pack}
                                onSelect={handleSelect}
                                isLoading={loadingId === pack.id}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="blog" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Devenez une autorité dans votre domaine ✍️</h2>
                        <p className="text-slate-500 mt-2">
                            Des articles de blog optimisés pour le SEO et engageants pour vos lecteurs, rédigés par nos experts.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
                        {blogPacks.map((pack) => (
                            <ServiceCard
                                key={pack.id}
                                pack={pack}
                                onSelect={handleSelect}
                                isLoading={loadingId === pack.id}
                            />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
