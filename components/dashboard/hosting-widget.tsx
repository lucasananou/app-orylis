import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, AlertCircle, Server } from "lucide-react";
import { formatDistanceToNow, isPast, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface HostingWidgetProps {
    hostingExpiresAt: Date | null;
    maintenanceActive: boolean;
}

export function HostingWidget({ hostingExpiresAt, maintenanceActive }: HostingWidgetProps) {
    if (maintenanceActive) {
        return (
            <Card className="border-l-4 border-l-green-600 border-y border-r border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Premium
                            </Badge>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hébergement & Maintenance</span>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-lg mt-2">Tout est sous contrôle 🛡️</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                        Votre hébergement et la maintenance de votre site sont inclus dans votre offre. Aucune action requise de votre part.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Server className="h-3.5 w-3.5" />
                        <span>Renouvellement automatique actif</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!hostingExpiresAt) {
        return null; // Pas de date d'expiration définie
    }

    const isExpired = isPast(hostingExpiresAt);
    const daysRemaining = Math.ceil((hostingExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isWarning = daysRemaining <= 30;

    if (isExpired) {
        return (
            <Card className="border-l-4 border-l-red-600 border-y border-r border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expiré</Badge>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hébergement</span>
                        </div>
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <CardTitle className="text-lg mt-2 text-red-700">Hébergement expiré 🚨</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                        Votre site risque d'être suspendu. Veuillez renouveler votre hébergement dès que possible.
                    </p>
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        Renouveler maintenant (70€)
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (isWarning) {
        return (
            <Card className="border-l-4 border-l-orange-500 border-y border-r border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Expire bientôt
                            </Badge>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hébergement</span>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg mt-2">Renouvellement nécessaire ⚠️</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                        Votre hébergement expire dans <strong>{daysRemaining} jours</strong> ({formatDistanceToNow(hostingExpiresAt, { locale: fr, addSuffix: true })}).
                    </p>
                    <div className="space-y-3">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                            Renouveler pour 1 an (70€)
                        </Button>
                        <p className="text-xs text-center text-slate-500">
                            Ou passez au <span className="font-medium text-blue-600 cursor-pointer hover:underline">pack maintenance</span> pour ne plus y penser.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Cas normal (plus de 30 jours)
    return (
        <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            Actif
                        </Badge>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hébergement</span>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-slate-400" />
                </div>
                <CardTitle className="text-lg mt-2">Hébergement actif ✅</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-600 mb-2">
                    Expire le {hostingExpiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
                </p>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, (365 - daysRemaining) / 365 * 100))}%` }}
                    />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">
                    {daysRemaining} jours restants
                </p>
            </CardContent>
        </Card>
    );
}
