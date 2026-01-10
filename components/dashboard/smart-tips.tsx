"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Users, Zap, Search } from "lucide-react";
import Link from "next/link";
import { createCheckoutSession } from "@/actions/stripe";
import { toast } from "sonner";

interface SmartTipsProps {
    data: {
        kpis: {
            visitors: number;
            bounceRate: string;
        } | null;
        userType?: {
            new: number;
            returning: number;
        };
        previousPeriod?: {
            activeUsers: number;
        } | null;
    } | null;
}

export function SmartTips({ data }: SmartTipsProps) {
    if (!data?.kpis) return null;

    const activeUsers = data.kpis.visitors;
    const bounceRate = parseFloat(data.kpis.bounceRate.replace('%', '')) || 0;
    const returningUsers = data.userType?.returning || 0;
    const newUsers = data.userType?.new || 0;
    const previousUsers = data.previousPeriod?.activeUsers || 0;


    // Déterminer la tendance (si on a les données précédentes)
    const growth = previousUsers > 0 ? ((activeUsers - previousUsers) / previousUsers) * 100 : 0;

    // Logique de recommandation prioritaire
    let tip = {
        icon: Lightbulb,
        color: "text-amber-500",
        bg: "bg-amber-50 border-amber-200",
        title: "Conseil Stratégique",
        description: "En attente de plus de données...",
        action: "Voir le marketplace",
        link: "/marketplace",
        stripe: false,
        amount: 0,
        productName: ""
    };

    // Scénario 1 : Taux de rebond élevé (> 60%) => Problème d'UX ou Vitesse ou Contenu
    if (bounceRate > 60) {
        tip = {
            icon: Zap,
            color: "text-red-600",
            bg: "bg-red-50 border-red-200",
            title: "Taux de rebond critique détecté",
            description: `70% de vos visiteurs partent sans action. Un site plus rapide ou une meilleure UX pourrait retenir ce trafic.`,
            action: "Optimiser la vitesse du site (150€)",
            link: "#",
            stripe: true,
            amount: 150,
            productName: "Optimisation Vitesse Max"
        };
    }
    // Scénario 2 : Faible trafic (< 100 visiteurs) => Besoin de visibilité
    else if (activeUsers < 100) {
        tip = {
            icon: Search,
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
            title: "Manque de visibilité ?",
            description: "Votre site est en ligne mais attire peu de monde. Un audit SEO permettrait de débloquer votre trafic.",
            action: "Commander un Audit SEO (190€)",
            link: "#",
            stripe: true,
            amount: 190,
            productName: "Audit SEO Technique"
        };
    }
    // Scénario 3 : Forte croissance (> 20%) => Capitaliser
    else if (growth > 20) {
        tip = {
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 border-green-200",
            title: "Votre trafic décolle ! 🚀",
            description: "C'est le moment idéal pour convertir ces nouveaux visiteurs avec une page de vente optimisée.",
            action: "Optimiser ma Page de Vente (350€)",
            link: "#",
            stripe: true,
            amount: 350,
            productName: "Copywriting Page Vente"
        };
    }
    // Scénario 4 : Beaucoup de visiteurs récurrents (> 30%) => Fidélisation
    else if (returningUsers > 0 && (returningUsers / (newUsers + returningUsers)) > 0.3) {
        tip = {
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50 border-purple-200",
            title: "Votre audience est fidèle ❤️",
            description: "Vos visiteurs reviennent ! Offrez-leur du contenu frais pour maintenir cet engagement.",
            action: "Commander un Article Blog (60€)",
            link: "#",
            stripe: true,
            amount: 60,
            productName: "Article Blog Premium"
        };
    }
    // Scénario par défaut (Trafic moyen stable)
    else {
        tip = {
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-200",
            title: "Passez au niveau supérieur",
            description: "Votre trafic est stable. Pour passer un cap, une stratégie de contenu régulière est recommandée.",
            action: "Voir les offres SEO",
            link: "/subscriptions", // Redirection vers abonnements
            stripe: false,
            amount: 0,
            productName: ""
        };
    }

    const handleAction = async () => {
        if (tip.stripe) {
            try {
                toast.loading("Redirection vers le paiement...");
                await createCheckoutSession(tip.amount, tip.productName);
            } catch (e) {
                toast.error("Erreur lors de la redirection");
            }
        } else {
            // Navigation handled by Link
        }
    };

    return (
        <Card className={`${tip.bg} border-2`}>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-2 rounded-full bg-white ${tip.color} shadow-sm`}>
                    <tip.icon className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className={`text-lg font-bold ${tip.color}`}>
                        {tip.title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-sm text-slate-700 font-medium max-w-xl">
                        {tip.description}
                    </p>
                    {tip.stripe ? (
                        <Button onClick={handleAction} className="bg-white text-slate-900 border hover:bg-slate-50 shadow-sm whitespace-nowrap">
                            {tip.action}
                        </Button>
                    ) : (
                        <Button asChild className="bg-white text-slate-900 border hover:bg-slate-50 shadow-sm whitespace-nowrap">
                            <Link href={tip.link as any}>
                                {tip.action}
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
