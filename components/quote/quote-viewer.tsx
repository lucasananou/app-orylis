"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface QuoteViewerProps {
  pdfUrl: string;
  createdAt?: Date | string | null;
  summary?: {
    total?: string;
    deliveryTime?: string;
    services?: string[];
  };
}

export function QuoteViewer({ pdfUrl, createdAt }: QuoteViewerProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  // Force stop loading after 3 seconds to prevent infinite loop
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Ensure PDF URL is valid and prevent caching issues
  const pdfUrlWithParams = React.useMemo(() => {
    if (!pdfUrl) return "";
    return `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  }, [pdfUrl]);

  return (
    <Card className="border-none shadow-none bg-transparent w-full">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Votre devis
            </CardTitle>
            <CardDescription className="text-base text-slate-500">
              Émis le {new Date().toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
            </CardDescription>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors" asChild>
            <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Aperçu PDF Grand Format - Style Premium */}
        <div className="w-full rounded-2xl border border-slate-200/60 bg-slate-50 shadow-sm overflow-hidden relative group">
          <div className="relative w-full h-[600px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10 transition-opacity duration-500">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <p className="text-sm text-slate-500 font-medium">Chargement du document...</p>
                </div>
              </div>
            )}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                <div className="text-center p-4">
                  <p className="text-sm text-red-500 mb-2">Impossible d'afficher l'aperçu</p>
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
              src={pdfUrlWithParams}
              className="w-full h-full border-0 mix-blend-multiply"
              title="Aperçu du devis"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />

            {/* Overlay bouton plein écran */}
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <Button asChild size="sm" className="bg-slate-900/90 text-white hover:bg-slate-900 shadow-xl backdrop-blur-sm border border-white/10">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Voir en plein écran
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
