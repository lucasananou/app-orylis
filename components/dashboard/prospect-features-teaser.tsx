"use client";

import { Lock, Ticket, FolderOpen, CreditCard, MessageSquarePlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProspectFeaturesTeaserProps {
  filesCount?: number;
  ticketsCount?: number;
}

export function ProspectFeaturesTeaser({
  filesCount = 0,
  ticketsCount = 0
}: ProspectFeaturesTeaserProps) {
  const features = [
    {
      icon: Ticket,
      title: "Créer et suivre vos tickets",
      description: "Demandez des modifications et suivez l'avancement de vos demandes",
      teaser: ticketsCount > 0 ? `${ticketsCount} ticket${ticketsCount > 1 ? "s" : ""} en attente` : undefined
    },
    {
      icon: FolderOpen,
      title: "Accéder à tous vos fichiers",
      description: "Téléchargez et gérez tous les fichiers de votre projet",
      teaser: filesCount > 0 ? `${filesCount} fichier${filesCount > 1 ? "s" : ""} disponible${filesCount > 1 ? "s" : ""}` : undefined
    },
    {
      icon: CreditCard,
      title: "Gérer vos factures",
      description: "Accédez à tous vos documents de facturation en un seul endroit"
    },
    {
      icon: MessageSquarePlus,
      title: "Donner votre feedback",
      description: "Partagez vos retours directement sur le projet"
    }
  ];

  return (
    <Card className="border border-border/70 bg-gradient-to-br from-muted/20 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          Fonctionnalités disponibles pour les clients
        </CardTitle>
        <CardDescription>
          Devenez client pour accéder à toutes ces fonctionnalités et suivre votre projet en détail.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative rounded-lg border border-border/50 bg-background/50 p-4 opacity-60"
              >
                <div className="absolute right-2 top-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                    {feature.teaser && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {feature.teaser}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-6 border-t border-border/50">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = "https://buy.stripe.com/aFafZh02O6yJf7H3DOgIo0p";
            }}
          >
            Devenir client maintenant
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Contactez-nous pour activer votre accès complet à toutes ces fonctionnalités.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

