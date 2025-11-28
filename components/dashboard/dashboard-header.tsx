import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
    userName?: string | null;
    userEmail?: string | null;
    greetingName: string;
    isProspect?: boolean;
    projectName?: string;
}

export function DashboardHeader({
    userName,
    userEmail,
    greetingName,
    isProspect = false,
    projectName
}: DashboardHeaderProps) {
    const initials = (userName ?? userEmail ?? "U").slice(0, 2).toUpperCase();

    if (isProspect && projectName) {
        return (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-gradient-to-r from-accent/5 to-accent/10 p-4 sm:mb-6 sm:gap-4 sm:rounded-2xl sm:p-6">
                <Avatar className="h-12 w-12 ring-2 ring-accent/20 sm:h-14 sm:w-14">
                    <AvatarFallback className="bg-accent/10 text-base font-semibold text-accent sm:text-lg">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl">
                            Bonjour {greetingName} 👋
                        </h2>
                        <Badge variant="secondary" className="text-xs">Prospect</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        Votre projet {projectName} est en cours. Suivez son avancement ci-dessous.
                    </p>
                </div>
                <Button
                    size="sm"
                    className="shrink-0 min-h-[44px] rounded-full"
                    asChild
                >
                    <a href="https://calendly.com/lucas-orylis/30min" target="_blank" rel="noopener noreferrer">
                        Prendre rendez-vous
                    </a>
                </Button>
            </div>
        );
    }

    return (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-gradient-to-r from-accent/5 to-accent/10 p-4 sm:mb-6 sm:gap-4 sm:rounded-2xl sm:p-6">
            <Avatar className="h-12 w-12 ring-2 ring-accent/20 sm:h-14 sm:w-14">
                <AvatarFallback className="bg-accent/10 text-base font-semibold text-accent sm:text-lg">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl">
                    Bonjour {greetingName} 👋
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                    Suivez en un coup d'oeil l'avancement de vos projets Orylis.
                </p>
            </div>
        </div>
    );
}
