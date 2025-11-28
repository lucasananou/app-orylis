import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Subscription {
    id: string;
    projectId: string;
    serviceType: "seo" | "maintenance" | "blog";
    status: string;
    currentPeriodEnd: Date;
    isManual?: boolean;
}

interface ActiveServicesProps {
    subscriptions: Subscription[];
}

export function ActiveServices({ subscriptions }: ActiveServicesProps) {
    if (subscriptions.length === 0) {
        return null;
    }

    const serviceLabels: Record<string, string> = {
        seo: "Référencement (SEO)",
        maintenance: "Maintenance & Sécurité",
        blog: "Rédaction & Blog"
    };

    return (
        <div className="mb-12 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Mes services actifs</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subscriptions.map((sub) => (
                    <Card key={sub.id} className="border-green-200 bg-green-50/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    Actif
                                </Badge>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <CardTitle className="mt-2 text-lg font-semibold">
                                {serviceLabels[sub.serviceType] || "Service"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-slate-600">
                                <Calendar className="mr-2 h-4 w-4" />
                                {sub.isManual ? (
                                    "Géré manuellement"
                                ) : (
                                    <>Renouvellement : {formatDate(sub.currentPeriodEnd)}</>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

