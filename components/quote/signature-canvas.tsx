"use client";

import * as React from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Check, Lock } from "lucide-react";

interface QuoteSignatureCanvasProps {
  onSign: (signatureDataUrl: string) => void;
  disabled?: boolean;
}

export function QuoteSignatureCanvas({ onSign, disabled }: QuoteSignatureCanvasProps) {
  const canvasRef = React.useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = React.useState(true);

  const handleClear = () => {
    canvasRef.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      setIsEmpty(false);
    } else {
      setIsEmpty(true);
    }
  };

  const handleSign = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSign(dataUrl);
    }
  };

  return (
    <Card className="border border-border/70 bg-white shadow-lg">
      <CardHeader className="pb-8">
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold">Signature électronique sécurisée</CardTitle>
          <CardDescription className="text-base">
            Cette signature vaut validation du devis et lancement du projet.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Badge sécurité */}
        <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
          <Lock className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">
            Signature chiffrée et horodatée
          </span>
        </div>

        {/* Canvas signature */}
        <div className="rounded-xl border border-border/50 bg-[#fafafa] p-4 shadow-sm">
          <SignatureCanvas
            ref={canvasRef}
            canvasProps={{
              className: "w-full h-48 rounded-lg bg-white",
              style: { touchAction: "none" }
            }}
            onEnd={handleEnd}
            backgroundColor="#ffffff"
            penColor="#000000"
          />
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={disabled || isEmpty}
            className="w-full text-base"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Effacer
          </Button>
          <Button
            type="button"
            onClick={handleSign}
            disabled={disabled || isEmpty}
            className="w-full bg-[#1b5bff] text-white transition-all duration-200 hover:bg-[#1553e6] hover:shadow-md text-base sm:text-lg py-6"
            size="lg"
          >
            <Check className="mr-2 h-5 w-5" />
            ✔️ Valider et lancer mon projet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

