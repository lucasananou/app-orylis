"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneIncoming, Target, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SalesSummaryProps {
    data: any;
}

export function SalesSummary({ data }: SalesSummaryProps) {
    if (!data) return null;

    const { stepOpening, stepDiscovery, stepPrice, stepObjections, stepClosing } = data;

    const getTempColor = (temp: string) => {
        if (temp === "chaud") return "bg-red-100 text-red-800";
        if (temp === "tiede") return "bg-amber-100 text-amber-800";
        return "bg-blue-100 text-blue-800";
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <PhoneIncoming className="h-5 w-5 text-slate-500" />
                    Dernier Appel de Vente
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
                <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase">Température</p>
                    <Badge variant="outline" className={getTempColor(stepOpening?.prospect_temperature)}>
                        {stepOpening?.prospect_temperature || "Non défini"}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                        <Target className="h-3 w-3" /> Objectif
                    </p>
                    <p className="text-sm font-medium truncate" title={stepDiscovery?.main_goal}>
                        {stepDiscovery?.main_goal || "-"}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Objection
                    </p>
                    <p className="text-sm font-medium truncate" title={stepObjections?.main_objection}>
                        {stepObjections?.main_objection || "-"}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Closing
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                        {stepClosing?.closing_status || "En cours"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
