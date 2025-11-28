import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UpsellItem } from "./service-data";

interface UpsellCardProps {
    item: UpsellItem;
    onSelect?: (itemId: string) => void;
}

export function UpsellCard({ item, onSelect }: UpsellCardProps) {
    return (
        <Card className="flex flex-col sm:flex-row overflow-hidden border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                            <Badge variant="secondary" className="text-xs font-normal">
                                {item.type === "one-shot" ? "Paiement unique" : "Mensuel"}
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm">{item.description}</p>
                    </div>
                    <div className="text-xl font-bold text-slate-900 whitespace-nowrap">
                        {item.price}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 mt-4">
                    {item.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 p-6 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-100 sm:w-48">
                <Button
                    variant="outline"
                    className="w-full border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => onSelect?.(item.id)}
                >
                    Ajouter
                </Button>
            </div>
        </Card>
    );
}
