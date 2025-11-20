import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteSignForm } from "@/components/quote/quote-sign-form";
import { CheckCircle2, Download } from "lucide-react";

// Lazy load des composants lourds
const QuoteViewer = dynamic(() => import("@/components/quote/quote-viewer").then(mod => ({ default: mod.QuoteViewer })), {
  loading: () => (
    <Card className="border border-border/70 bg-white shadow-lg w-full">
      <CardContent className="p-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  ),
  ssr: true
});

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget").then(mod => ({ default: mod.default })), {
  ssr: false // Chat widget n'a pas besoin de SSR
});

// Cache 10 secondes : les devis peuvent être signés rapidement
export const revalidate = 10;

type Ctx = { params: Promise<{ id: string }> };

async function loadQuoteData(id: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;

  if (!isProspect(user.role)) {
    redirect("/");
  }

  // Récupérer le devis
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, id),
    columns: {
      id: true,
      projectId: true,
      pdfUrl: true,
      signedPdfUrl: true,
      status: true,
      signedAt: true,
      createdAt: true
    }
  });

  if (!quote) {
    redirect("/demo");
  }

  // Vérifier que le devis appartient au prospect
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, quote.projectId),
    columns: {
      ownerId: true,
      name: true
    }
  });

  if (!project || project.ownerId !== user.id) {
    redirect("/demo");
  }

  return {
    quote,
    projectName: project.name
  };
}

export default async function QuotePage(ctx: Ctx): Promise<JSX.Element> {
  const { id } = await ctx.params;
  const { quote, projectName } = await loadQuoteData(id);

  const isSigned = quote.status === "signed";

  return (
    <>
      <PageHeader
        title="Devis – Création de site internet"
        description={`Devis personnalisé pour le projet ${projectName}`}
      />

      {isSigned ? (
        <div className="w-full mx-auto max-w-3xl lg:max-w-6xl safe-px min-w-0 pb-24">
          <Card className="border border-green-200 bg-green-50/50 w-full">
            <CardHeader>
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg text-green-900 break-words">Devis signé !</CardTitle>
                  <CardDescription className="text-green-700 break-words">
                    Votre devis a été signé le{" "}
                    {quote.signedAt
                      ? new Date(quote.signedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })
                      : "—"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="text-sm sm:text-base w-full sm:w-auto">
                  <a href={quote.signedPdfUrl!} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4 shrink-0" />
                    Télécharger le devis signé
                  </a>
                </Button>
                <Button variant="outline" asChild className="text-sm sm:text-base w-full sm:w-auto">
                  <a href="/demo">
                    Retour à la démo
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full mx-auto max-w-3xl lg:max-w-6xl safe-px min-w-0 pb-24">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1.2fr_1fr] w-full min-w-0">
            {/* Colonne de gauche : Aperçu du devis */}
            <div className="w-full min-w-0">
              <QuoteViewer 
                pdfUrl={quote.pdfUrl} 
                createdAt={quote.createdAt}
                summary={{
                  deliveryTime: "2-4 semaines",
                  services: ["Site web personnalisé", "Design sur-mesure", "Optimisation SEO", "Support 3 mois"]
                }}
              />
            </div>

            {/* Colonne de droite : Signature + Bloc "après validation" */}
            <div className="space-y-4 sm:space-y-6 w-full min-w-0">
              <QuoteSignForm quoteId={id} />
              <Card className="border border-accent/20 bg-gradient-to-br from-accent/5 to-blue-50/30 w-full">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl break-words">
                    <span className="shrink-0">✨</span>
                    Après validation…
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base break-words">
                    Voici ce que nous allons faire :
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl shrink-0">🚀</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-foreground break-words">Nous lançons immédiatement la préparation de votre site final</p>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                          Votre projet passe en phase de développement dès validation du devis.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl shrink-0">📅</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-foreground break-words">Vous recevez une date estimée de livraison</p>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                          Nous vous communiquons un planning précis dans les 24h suivant la validation.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl shrink-0">💬</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-foreground break-words">Vous accédez au système de tickets et échanges avec Lucas</p>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                          Communication directe et suivi en temps réel de l&apos;avancement de votre projet.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl shrink-0">📁</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-foreground break-words">Vous pouvez envoyer vos contenus (photos, textes…)</p>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                          Partagez facilement tous vos éléments via votre espace client sécurisé.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      <ChatWidget />
    </>
  );
}

