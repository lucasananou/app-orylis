"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface Subscription {
    id: string;
    serviceType: "seo" | "maintenance" | "blog";
    status: string;
    isManual?: boolean;
}

interface ClientServicesManagerProps {
    clientId: string;
    projectId: string;
    subscriptions: Subscription[];
}

export function ClientServicesManager({ clientId, projectId, subscriptions }: ClientServicesManagerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const activeSubscriptions = subscriptions.filter(s => s.status === "active");

    const handleAddService = async (serviceType: "seo" | "maintenance" | "blog") => {
        setLoading(serviceType);
        try {
            const response = await fetch(`/api/admin/clients/${clientId}/services`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, serviceType })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erreur lors de l'ajout.");
            }

            toast.success("Service activé !");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur.");
        } finally {
            setLoading(null);
        }
    };

    const handleRemoveService = async (subscriptionId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir désactiver ce service ?")) return;
        setLoading(subscriptionId);
        try {
            const response = await fetch(`/api/admin/clients/${clientId}/services`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId })
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la suppression.");
            }

            toast.success("Service désactivé !");
            router.refresh();
        } catch (error) {
            toast.error("Erreur.");
        } finally {
            setLoading(null);
        }
    };

    const hasService = (type: string) => activeSubscriptions.some(s => s.serviceType === type);

    return (
        <div className="space-y-6">
            {activeSubscriptions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun service actif.</p>
            ) : (
                <div className="space-y-2">
                    {activeSubscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                            <div className="flex items-center gap-3">
                                <Badge variant="default" className="capitalize">
                                    {sub.serviceType}
                                </Badge>
                                {sub.isManual && <Badge variant="secondary" className="text-xs">Manuel</Badge>}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveService(sub.id)}
                                disabled={!!loading}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                {loading === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Ajouter un service manuellement</h4>
                <div className="flex gap-2 flex-wrap">
                    {!hasService("maintenance") && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddService("maintenance")}
                            disabled={!!loading}
                        >
                            {loading === "maintenance" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" />
                            Maintenance
                        </Button>
                    )}
                    {!hasService("seo") && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddService("seo")}
                            disabled={!!loading}
                        >
                            {loading === "seo" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" />
                            SEO
                        </Button>
                    )}
                    {!hasService("blog") && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddService("blog")}
                            disabled={!!loading}
                        >
                            {loading === "blog" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" />
                            Blog
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
