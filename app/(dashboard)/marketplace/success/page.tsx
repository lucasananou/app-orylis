
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function MarketplaceSuccessPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Paiement réussi"
                description="Merci pour votre commande."
            />

            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Commande confirmée ! 🎉</h2>
                <p className="text-lg text-slate-600 max-w-lg mx-auto mb-8">
                    Nous avons bien reçu votre paiement. Notre équipe va traiter votre demande dans les plus brefs délais. Vous recevrez un email de confirmation.
                </p>

                <div className="flex gap-4">
                    <Button asChild size="lg">
                        <Link href="/marketplace">
                            Retour à la boutique
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/">
                            Aller au tableau de bord
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
