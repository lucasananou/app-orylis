import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Database, Zap, Lock } from "lucide-react";

interface SiteHealthWidgetProps {
    maintenanceActive: boolean;
}

export function SiteHealthWidget({ maintenanceActive }: SiteHealthWidgetProps) {
    if (!maintenanceActive) {
        return (
            <Card className="border border-slate-200 shadow-sm bg-slate-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                                Standard
                            </Badge>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Santé du site</span>
                        </div>
                    </div>
                    <CardTitle className="text-lg mt-2 text-slate-700">Maintenance non gérée</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <ShieldCheck className="h-4 w-4 text-slate-400" />
                                <span>Sécurité & Mises à jour</span>
                            </div>
                            <span className="text-slate-400 text-xs">Manuelles</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Database className="h-4 w-4 text-slate-400" />
                                <span>Sauvegardes</span>
                            </div>
                            <span className="text-slate-400 text-xs">Non inclus</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Zap className="h-4 w-4 text-slate-400" />
                                <span>Performance</span>
                            </div>
                            <span className="text-slate-400 text-xs">Standard</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 text-center">
                            Passez au pack maintenance pour sécuriser votre site.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Protégé
                        </Badge>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Santé du site</span>
                    </div>
                    <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg mt-2">Site sécurisé & optimisé 🔒</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <span>Sécurité & Mises à jour</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 h-5">
                            À jour
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Database className="h-4 w-4 text-blue-600" />
                            <span>Sauvegardes</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-1.5 h-5">
                            Quotidiennes
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <span>Performance</span>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-[10px] px-1.5 h-5">
                            Optimisée
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
