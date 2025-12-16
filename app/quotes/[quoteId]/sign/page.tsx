import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes, projects, profiles, authUsers } from "@/lib/schema";
import { QuoteSigningForm } from "./form";
import { PayDepositButton } from "@/components/quote/pay-deposit-button";
import { auth } from "@/auth";
import { isProspect } from "@/lib/utils";


export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ quoteId: string }>;
}

export default async function QuoteSigningPage({ params }: PageProps) {
    const session = await auth();
    const { quoteId } = await params;

    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
            project: true
        }
    });

    if (!quote) {
        notFound();
    }

    // Récupérer les infos du prospect pour l'affichage
    const project = quote.project;
    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, project.ownerId),
        columns: { fullName: true, company: true }
    });
    const authUser = await db.query.authUsers.findFirst({
        where: eq(authUsers.id, project.ownerId),
        columns: { name: true }
    });

    const prospectName = profile?.fullName ?? authUser?.name ?? "Client";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="relative h-8 w-32">
                        <img
                            src="/logo-orylis.png"
                            alt="Orylis"
                            className="h-full w-full object-contain object-left"
                        />
                    </div>
                    <div className="h-4 w-px bg-gray-300" />
                    <h1 className="font-medium text-gray-900 truncate">Devis pour {project.name}</h1>
                </div>
                <div className="text-sm text-gray-500 hidden sm:block">
                    {quote.status === "signed" ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                            ✓ Signé le {quote.signedAt?.toLocaleDateString()}
                        </span>
                    ) : (
                        <span className="text-orange-600 font-medium">En attente de signature</span>
                    )}
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-4 lg:py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* PDF - Left Column */}
                    <div className="lg:col-span-2 w-full bg-white rounded-xl shadow-sm border overflow-hidden h-[600px] lg:h-[1000px]">
                        <iframe
                            src={`${quote.status === "signed" && quote.signedPdfUrl ? quote.signedPdfUrl : quote.pdfUrl}#navpanes=0&scrollbar=0`}
                            className="w-full h-full border-none"
                            title="Devis PDF"
                        />
                    </div>

                    {/* Action - Right Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24" id="signature-section">
                            <h2 className="text-lg font-semibold mb-4">Validation du devis</h2>

                            {quote.status === "signed" ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                                        ✓
                                    </div>
                                    <h3 className="font-medium text-gray-900 mb-2">Devis signé !</h3>

                                    {/* Si c'est un prospect, il doit payer l'acompte */}
                                    {isProspect(session?.user?.role) ? (
                                        <div className="mb-6">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Merci {prospectName}. Pour valider définitivement le projet, merci de régler l'acompte.
                                            </p>
                                            <PayDepositButton quoteId={quote.id} />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 mb-6">
                                            Merci {prospectName}. Votre projet est validé et l'acompte a été reçu.
                                        </p>
                                    )}

                                    <a
                                        href={quote.signedPdfUrl!}
                                        download
                                        className="block w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Télécharger le devis signé
                                    </a>
                                </div>
                            ) : (
                                <QuoteSigningForm quoteId={quote.id} prospectName={prospectName} />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky CTA */}
            {quote.status !== "signed" && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:hidden">
                    <a
                        href="#signature-section"
                        className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Signer le devis
                    </a>
                </div>
            )}
        </div>
    );
}
