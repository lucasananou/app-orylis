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
    <Card className="border border-border/70 bg-white shadow-lg w-full">
      <CardHeader className="pb-4 sm:pb-6 md:pb-8">
        <div className="space-y-1.5 sm:space-y-2">
          <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold break-words">Votre devis personnalisé – Orylis</CardTitle>
          {formattedDate && (
            <CardDescription className="text-sm sm:text-base break-words">
              Créé le : {formattedDate}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="w-full rounded-lg sm:rounded-xl border border-border/50 bg-muted/5 shadow-md">
          <div className="relative w-full" style={{ minHeight: "300px", maxHeight: "60vh" }}>
            <iframe
              src={pdfUrl}
              className="absolute inset-0 w-full h-full border-0"
              title="Aperçu du devis"
            />
          </div>
        </div>
        <Button
          className="w-full bg-[#1b5bff] text-white transition-all duration-200 hover:bg-[#1553e6] hover:shadow-md text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-5"
          size="lg"
          asChild
        >
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Télécharger le devis (PDF)
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

