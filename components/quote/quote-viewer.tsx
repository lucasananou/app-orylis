"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2, Calendar, Euro, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuoteViewerProps {
  pdfUrl: string;
  createdAt?: Date | string | null;
  summary?: {
    total?: string;
    deliveryTime?: string;
    services?: string[];
  };
}

export function QuoteViewer({ pdfUrl, createdAt, summary }: QuoteViewerProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : null;

  React.useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [pdfUrl]);

  return (
    <Card className="border border-border/70 bg-white shadow-lg w-full">
      <CardHeader className="pb-4 sm:pb-6 md:pb-8">
        <div className="space-y-1.5 sm:space-y-2">
          <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold break-words">
            Votre devis personnalisé – Orylis
          </CardTitle>
          {formattedDate && (
            <CardDescription className="text-sm sm:text-base break-words">
              Créé le : {formattedDate}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Résumé des éléments clés */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 bg-gradient-to-br from-accent/5 to-blue-50/30 rounded-lg border border-accent/20">
            {summary.total && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Euro className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold text-foreground">{summary.total}</p>
                </div>
              </div>
            )}
            {summary.deliveryTime && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Délai estimé</p>
                  <p className="text-lg font-semibold text-foreground">{summary.deliveryTime}</p>
                </div>
              </div>
            )}
            {summary.services && summary.services.length > 0 && (
              <div className="sm:col-span-2 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 shrink-0">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-2">Services inclus</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.services.map((service, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aperçu PDF avec loader */}
        <div className="w-full rounded-lg sm:rounded-xl border border-border/50 bg-muted/5 shadow-md overflow-hidden">
          <div className="relative w-full" style={{ minHeight: "400px", maxHeight: "70vh" }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">Chargement du devis...</p>
                </div>
              </div>
            )}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center p-4">
                  <p className="text-sm text-destructive mb-2">Erreur lors du chargement</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasError(false);
                      setIsLoading(true);
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            )}
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Aperçu du devis"
              style={{ minHeight: "400px", maxHeight: "70vh" }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 bg-[#1b5bff] text-white transition-all duration-200 hover:bg-[#1553e6] hover:shadow-md"
            size="lg"
            asChild
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4 shrink-0" />
              Télécharger le devis (PDF)
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            asChild
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              Ouvrir dans un nouvel onglet
            </a>
          </Button>
        </div>

        {/* Message d'aide */}
        <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-900 font-medium mb-1">💡 Astuce</p>
            <p className="text-xs text-blue-700">
              Vous pouvez faire défiler le devis directement dans cette page. Pour une meilleure expérience, 
              téléchargez-le ou ouvrez-le dans un nouvel onglet.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

