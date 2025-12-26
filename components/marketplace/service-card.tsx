"use client";

import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
    title: string;
    description: string;
    price: string;
    features: string[];
    popular?: boolean;
    ctaLabel?: string;
    onCtaClick?: () => void;
    isLoading?: boolean;
}

export function ServiceCard({
    title,
    description,
    price,
    features,
    popular,
    ctaLabel = "Commander",
    onCtaClick,
    isLoading = false
}: ServiceCardProps) {
    return (
        <Card className={`flex flex-col border-border/70 transition-all hover:shadow-md ${popular ? 'border-primary/50 shadow-sm relative' : ''}`}>
            {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary">
                        Populaire
                    </Badge>
                </div>
            )}
            <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="mb-6">
                    <span className="text-3xl font-bold">{price}</span>
                    {price !== "Sur devis" && <span className="text-muted-foreground"> / prestation</span>}
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full gap-2"
                    variant={popular ? "default" : "outline"}
                    onClick={onCtaClick}
                    disabled={isLoading}
                >
                    {isLoading ? "Redirection..." : ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
