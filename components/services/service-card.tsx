import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ServicePack } from "./service-data";

interface ServiceCardProps {
    pack: ServicePack;
    onSelect?: (packId: string) => void;
    isLoading?: boolean;
}

export function ServiceCard({ pack, onSelect, isLoading }: ServiceCardProps) {
    const isRecommended = pack.recommended;

    const colorStyles = {
        green: "border-green-200 bg-green-50/30 hover:border-green-300",
        blue: "border-blue-200 bg-blue-50/30 hover:border-blue-300",
        purple: "border-purple-200 bg-purple-50/30 hover:border-purple-300",
        amber: "border-amber-200 bg-amber-50/30 hover:border-amber-300"
    };

    const badgeStyles = {
        green: "bg-green-100 text-green-700 hover:bg-green-100",
        blue: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        purple: "bg-purple-100 text-purple-700 hover:bg-purple-100",
        amber: "bg-amber-100 text-amber-700 hover:bg-amber-100"
    };

    const buttonStyles = {
        green: "bg-green-600 hover:bg-green-700",
        blue: "bg-blue-600 hover:bg-blue-700",
        purple: "bg-purple-600 hover:bg-purple-700",
        amber: "bg-amber-600 hover:bg-amber-700"
    };

    return (
        <Card className={cn(
            "relative flex flex-col transition-all duration-200",
            colorStyles[pack.color],
            isRecommended && "shadow-lg scale-105 z-10 border-2"
        )}>
            {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={cn("px-3 py-1", badgeStyles[pack.color])}>
                        Recommandé
                    </Badge>
                </div>
            )}

            <CardHeader>
                <CardTitle className="text-xl font-bold">{pack.title}</CardTitle>
                <div className="mt-2 text-3xl font-bold text-slate-900">{pack.price}</div>
                <CardDescription className="mt-2 min-h-[40px]">{pack.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
                <ul className="space-y-3">
                    {pack.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <Check className={cn("h-4 w-4 mt-0.5 shrink-0", `text-${pack.color}-600`)} />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter>
                <Button
                    className={cn("w-full", buttonStyles[pack.color])}
                    onClick={() => onSelect?.(pack.id)}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirection...
                        </>
                    ) : (
                        "Choisir ce pack"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
