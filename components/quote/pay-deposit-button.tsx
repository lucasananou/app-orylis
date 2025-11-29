"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface PayDepositButtonProps {
    quoteId: string;
}

export function PayDepositButton({ quoteId }: PayDepositButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/quotes/${quoteId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // No signature needed if already signed
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de l'initialisation du paiement");
            }

            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                toast.error("Impossible de créer la session de paiement.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1F66FF] hover:bg-[#1553CC] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                </>
            ) : (
                <>
                    <CreditCard className="h-4 w-4" />
                    Régler l'acompte (500€)
                </>
            )}
        </button>
    );
}
