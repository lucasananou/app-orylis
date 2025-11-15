"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface QuoteViewerProps {
  pdfUrl: string;
}

export function QuoteViewer({ pdfUrl }: QuoteViewerProps) {
  return (
    <Card className="border border-border/70 bg-white shadow-subtle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ExternalLink className="h-5 w-5" />
          Aperçu du devis
        </CardTitle>
        <CardDescription>
          Consultez votre devis ci-dessous. Vous pourrez le signer après l&apos;avoir lu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full overflow-hidden rounded-lg border-2 border-border/60 bg-muted/10 shadow-lg" style={{ minHeight: "600px" }}>
          <iframe
            src={pdfUrl}
            className="h-full w-full border-0"
            title="Aperçu du devis"
            style={{ width: "100%", height: "600px" }}
          />
        </div>
        <Button variant="outline" className="w-full text-sm sm:text-base" asChild>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Télécharger le devis (PDF)
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

