"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QuoteViewerProps {
  pdfUrl: string;
  createdAt?: Date | string | null;
}

export function QuoteViewer({ pdfUrl, createdAt }: QuoteViewerProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : null;

  return (
    <Card className="border border-border/70 bg-white shadow-lg">
      <CardHeader className="pb-8">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Votre devis personnalisé – Orylis</CardTitle>
          {formattedDate && (
            <CardDescription className="text-base">
              Créé le : {formattedDate}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-muted/5 shadow-md" style={{ minHeight: "500px" }}>
          <iframe
            src={pdfUrl}
            className="h-full w-full border-0"
            title="Aperçu du devis"
            style={{ width: "100%", height: "500px" }}
          />
        </div>
        <Button
          className="w-full bg-[#1b5bff] text-white transition-all duration-200 hover:bg-[#1553e6] hover:shadow-md text-base sm:text-lg py-6"
          size="lg"
          asChild
        >
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-5 w-5" />
            Télécharger le devis (PDF)
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

