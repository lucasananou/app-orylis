"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface QuoteSigningFormProps {
    quoteId: string;
    prospectName: string;
}

export function QuoteSigningForm({ quoteId, prospectName }: QuoteSigningFormProps) {
    const router = useRouter();
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const clear = () => {
        sigCanvas.current?.clear();
    };

    const submit = async () => {
        if (!accepted) {
            toast.error("Veuillez accepter les conditions.");
            return;
        }

        if (sigCanvas.current?.isEmpty()) {
            toast.error("Veuillez signer le document.");
            return;
        }

        setLoading(true);
        try {
            const signature = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");

            const res = await fetch(`/api/quotes/${quoteId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature })
            });

            const data = await res.json();
            console.log("[Sign Form] API Response:", data);

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de la signature");
            }

            if (data.checkoutUrl) {
                toast.success("Devis signé ! Redirection vers le paiement de l'acompte...");
                window.location.href = data.checkoutUrl;
                return;
            }

            toast.success("Devis signé avec succès !");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
            setLoading(false); // Only stop loading if error or no redirect
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre signature
                </label>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{
                            width: 300,
                            height: 150,
                            className: "w-full h-[150px] cursor-crosshair bg-white"
                        }}
                    />
                </div>
                <button
                    onClick={clear}
                    className="text-xs text-gray-500 mt-1 hover:text-gray-700 underline"
                >
                    Effacer la signature
                </button>
            </div>

            <div className="flex items-start gap-2">
                <input
                    type="checkbox"
                    id="accept"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="accept" className="text-sm text-gray-600">
                    Je, <strong>{prospectName}</strong>, reconnais avoir pris connaissance du devis et l'accepte sans réserve. Cette signature vaut pour accord et commande ferme.
                </label>
            </div>

            <button
                onClick={submit}
                disabled={loading || !accepted}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validation en cours...
                    </>
                ) : (
                    "Valider et Signer le devis"
                )}
            </button>

            <p className="text-xs text-gray-400 text-center">
                En signant, vous acceptez les Conditions Générales de Vente d'Orylis.
            </p>
        </div>
    );
}
