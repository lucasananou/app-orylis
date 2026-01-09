"use client";

import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Phone, Mail, Calendar, Check } from "lucide-react";
import { useState } from "react";

interface QuickActionsProps {
    phone?: string | null;
    email?: string | null;
    calendlyUrl?: string | null;
    onAction?: (action: "call" | "email" | "calendar") => void;
    variant?: "default" | "ghost" | "outline";
    size?: "default" | "sm" | "icon";
    className?: string; // Add className prop
}

export function QuickActions({
    phone,
    email,
    calendlyUrl,
    onAction,
    variant = "ghost",
    size = "icon",
    className,
}: QuickActionsProps) {
    const [copied, setCopied] = useState(false);

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (phone) {
            navigator.clipboard.writeText(phone);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            onAction?.("call");
        }
    };

    const handleEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (email) {
            window.location.href = `mailto:${email}`;
            onAction?.("email");
        }
    };

    const handleCalendar = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Updated to use a real potential link if available or fallback
        const url = calendlyUrl || "https://calendly.com/";
        window.open(url, "_blank");
        onAction?.("calendar");
    };

    const cn = (classes: string) => classes; // Simple local helper if cn is not imported, or import it.
    // Assuming cn imports usually exist, but I will just concat strings carefully or assume import if I see it.
    // Looking at file content, cn is not imported. I'll just use template literals.

    const baseButtonClass = `h-8 w-8 ${variant === 'ghost' ? 'text-muted-foreground hover:text-primary' : ''} ${className || ''}`;

    return (
        <div className="flex items-center gap-1">
            <TooltipProvider>
                {phone && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={variant}
                                size={size}
                                className={baseButtonClass}
                                asChild
                            >
                                <a
                                    href="https://phone.onoffbusiness.com/calls"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleCall}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Appeler</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {email && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={variant}
                                size={size}
                                className={baseButtonClass}
                                asChild
                            >
                                <a href={`mailto:${email}`} onClick={(e) => { e.stopPropagation(); onAction?.("email"); }}>
                                    <Mail className="h-4 w-4" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Envoyer un email</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={variant}
                            size={size}
                            className={baseButtonClass}
                            asChild
                        >
                            <a href={calendlyUrl || "https://calendly.com/"} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); onAction?.("calendar"); }}>
                                <Calendar className="h-4 w-4" />
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Planifier un RDV</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
