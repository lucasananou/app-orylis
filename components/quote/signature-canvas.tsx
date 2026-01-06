"use client";

import * as React from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Check, Lock, Phone } from "lucide-react";

import confetti from "canvas-confetti";

interface QuoteSignatureCanvasProps {
  onSign: (signatureDataUrl: string) => void;
  disabled?: boolean;
  projectDetails?: {
    name: string;
    total: string;
    delay: string;
  };
}

export function QuoteSignatureCanvas({ onSign, disabled, projectDetails }: QuoteSignatureCanvasProps) {
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

  // Ensure canvas is properly sized on mount/resize
  React.useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current.getCanvas();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        // canvasRef.current.clear(); // Removing this as it clears the signature on mobile resize events (scrolling, keyboard)
        // setIsEmpty(true);
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const handleSign = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      // Confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSign(dataUrl);
    }
  };

  return (
    <Card className="relative border border-slate-100 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 w-full overflow-hidden group">
      {/* Micro-gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent opacity-50 pointer-events-none" />

      <CardHeader className="pb-2 sm:pb-4 relative z-10">
        <div className="space-y-1.5 sm:space-y-2">
          <CardTitle className="text-lg sm:text-xl font-semibold break-words">Signature électronique sécurisée</CardTitle>
          <CardDescription className="text-sm sm:text-base break-words">
            Cette signature vaut validation du devis et lancement du projet.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        {/* Mini-Recap (Projet, Total, Délai) */}
        {projectDetails && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Projet</p>
              <p className="text-xs font-bold text-slate-900 truncate" title={projectDetails.name}>
                {projectDetails.name}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total</p>
              <p className="text-xs font-bold text-slate-900">{projectDetails.total}</p>
            </div>
            <div className="border-l border-slate-200 pl-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Délai</p>
              <p className="text-xs font-bold text-slate-900">{projectDetails.delay}</p>
            </div>
          </div>
        )}

        {/* Badge sécurité */}
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 sm:px-4 sm:py-2.5">
          <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-blue-900 break-words">
            Signature chiffrée et horodatée
          </span>
        </div>

        {/* Canvas signature - Optimisé mobile */}
        <div className="space-y-2">
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-[#fafafa] p-1 sm:p-2 shadow-inner w-full hover:border-blue-400 transition-colors">
            <div className="relative w-full bg-white rounded-lg overflow-hidden" style={{ minHeight: "200px" }}>
              <SignatureCanvas
                ref={canvasRef}
                canvasProps={{
                  className: "w-full h-full touch-none",
                  style: {
                    touchAction: "none",
                    width: "100%",
                    height: "200px",
                    maxWidth: "100%",
                    minHeight: "200px"
                  }
                }}
                onEnd={handleEnd}
                backgroundColor="#ffffff"
                penColor="#000000"
                velocityFilterWeight={0.7}
                minWidth={2}
                maxWidth={3}
              />
              {isEmpty && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <p className="text-sm text-slate-300 font-medium">
                    Tracez votre signature ici
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Reassurance juridique */}
          <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            Stockage sécurisé + horodatage officiel
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            Archivage 5 ans
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={disabled || isEmpty}
            className="w-full text-sm sm:text-base py-2 text-slate-500 hover:text-slate-900"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5 shrink-0" />
            Effacer
          </Button>
          <Button
            type="button"
            onClick={handleSign}
            disabled={disabled || isEmpty}
            className="w-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02] text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6 rounded-xl font-bold shadow-blue-200/50 shadow-lg"
            size="lg"
          >
            <Check className="mr-2 h-5 w-5 shrink-0" />
            Valider et lancer mon projet
          </Button>
        </div>

        {/* Ce que déclenche la signature */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Ce que cette signature déclenche
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-3 w-3" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-medium text-slate-900">Lancement immédiat :</span> Vous gagnez 24 à 48h sur la livraison.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 rounded-full bg-blue-100 text-blue-600">
                <Check className="h-3 w-3" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Création de votre espace client & mise en place du planning.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Secondaire */}
        <div className="pt-2 text-center">
          <Button
            variant="link"
            asChild
            className="text-slate-600 hover:text-slate-900 text-xs font-medium h-auto p-0 hover:no-underline group"
          >
            <a href="#" className="flex items-center gap-2 transition-transform hover:translate-x-px">
              <Phone className="h-3 w-3" />
              <span className="group-hover:underline underline-offset-4 decoration-slate-300">
                Parler à un expert avant de signer (10 min)
              </span>
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
