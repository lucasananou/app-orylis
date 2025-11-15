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
    <Card className="border border-border/70 bg-white shadow-lg w-full">
      <CardHeader className="pb-4 sm:pb-6 md:pb-8">
        <div className="space-y-1.5 sm:space-y-2">
          <CardTitle className="text-lg sm:text-xl font-semibold break-words">Signature électronique sécurisée</CardTitle>
          <CardDescription className="text-sm sm:text-base break-words">
            Cette signature vaut validation du devis et lancement du projet.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Badge sécurité */}
        <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 sm:px-4 sm:py-2.5">
          <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-foreground break-words">
            Signature chiffrée et horodatée
          </span>
        </div>

        {/* Canvas signature */}
        <div className="rounded-lg sm:rounded-xl border border-border/50 bg-[#fafafa] p-3 sm:p-4 shadow-sm w-full">
          <SignatureCanvas
            ref={canvasRef}
            canvasProps={{
              className: "w-full h-40 sm:h-48 md:h-56 rounded-lg bg-white",
              style: { touchAction: "none", width: "100%", maxWidth: "100%" }
            }}
            onEnd={handleEnd}
            backgroundColor="#ffffff"
            penColor="#000000"
          />
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={disabled || isEmpty}
            className="w-full text-sm sm:text-base py-3 sm:py-4"
          >
            <RotateCcw className="mr-2 h-4 w-4 shrink-0" />
            Effacer
          </Button>
          <Button
            type="button"
            onClick={handleSign}
            disabled={disabled || isEmpty}
            className="w-full bg-[#1b5bff] text-white transition-all duration-200 hover:bg-[#1553e6] hover:shadow-md text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-5"
            size="lg"
          >
            <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            ✔️ Valider et lancer mon projet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

