"use client";

import * as React from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Check } from "lucide-react";

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
    <Card className="border border-border/70 bg-white shadow-subtle">
      <CardHeader>
        <CardTitle className="text-lg">Signature électronique</CardTitle>
        <CardDescription>
          Signez le devis en dessinant votre signature dans le cadre ci-dessous
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-4">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={disabled || isEmpty}
            className="text-sm sm:text-base"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Effacer
          </Button>
          <Button
            type="button"
            onClick={handleSign}
            disabled={disabled || isEmpty}
            className="text-sm sm:text-base"
          >
            <Check className="mr-2 h-4 w-4" />
            Valider la signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

