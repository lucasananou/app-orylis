"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Brief {
    id: string;
    version: number;
    status: "draft" | "sent" | "approved" | "rejected";
    clientComment: string | null;
    createdAt: string;
    updatedAt: string;
}

interface BriefHistoryProps {
    briefs: Brief[];
}

export function BriefHistory({ briefs }: BriefHistoryProps) {
    if (briefs.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-slate-500" />
                    Historique des versions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] pr-4 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        {briefs.map((brief) => (
                            <div key={brief.id} className="relative pl-6 border-l-2 border-slate-200 last:border-0">
                                <div className={cn(
                                    "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white",
                                    brief.status === "approved" ? "bg-green-500" :
                                        brief.status === "rejected" ? "bg-red-500" :
                                            brief.status === "sent" ? "bg-blue-500" : "bg-slate-300"
                                )} />

                                <div className="flex flex-col gap-1 mb-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">Version {brief.version}</span>
                                        <span className="text-xs text-slate-500">
                                            {format(new Date(brief.createdAt), "d MMM yyyy à HH:mm", { locale: fr })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {brief.status === "approved" && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Validé
                                            </Badge>
                                        )}
                                        {brief.status === "rejected" && (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                <XCircle className="mr-1 h-3 w-3" /> Modifications demandées
                                            </Badge>
                                        )}
                                        {brief.status === "sent" && (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                <Clock className="mr-1 h-3 w-3" /> En attente de validation
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {brief.clientComment && (
                                    <div className="mt-2 text-sm bg-slate-50 p-3 rounded border border-slate-100 text-slate-600 italic">
                                        "{brief.clientComment}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
