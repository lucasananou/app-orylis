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
import { QuoteTrustSection, QuoteFAQ, QuoteTimeline } from "@/components/quote/quote-trust-section";
import { ChatWidgetClient } from "@/components/chat/chat-widget-client";
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
      <div className="w-full mx-auto max-w-[1600px] safe-px min-w-0 pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          {/* Top Bar: Progress & Social Proof */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium text-slate-400 hidden sm:inline">Démo</span>
              </div>
              <div className="h-px w-4 sm:w-8 bg-slate-200 shrink-0" />
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm ring-2 ring-blue-100">
                  2
                </span>
                <span className="text-sm font-bold text-slate-900">Validation</span>
              </div>
              <div className="h-px w-4 sm:w-8 bg-slate-200 shrink-0" />
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
                  3
                </span>
                <span className="text-sm font-medium text-slate-400 hidden sm:inline">Lancement</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 self-start sm:self-auto shrink-0">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 w-5 rounded-full bg-slate-200 border-2 border-white" />
                ))}
              </div>
              <span className="text-xs font-semibold text-amber-900 whitespace-nowrap">
                +100 projets livrés • <span className="text-amber-600">★ 4.9/5</span>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Devis – Création de site internet
            </h1>
            <p className="text-slate-500">
              Devis personnalisé pour le projet <span className="font-medium text-slate-900">{projectName}</span>
            </p>
          </div>
        </div>
      </div>

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
                <Button asChild className="text-sm sm:text-base w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                  <a href="/">
                    Accéder à mon espace client
                  </a>
                </Button>
                <Button variant="outline" asChild className="text-sm sm:text-base w-full sm:w-auto">
                  <a href={quote.signedPdfUrl!} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4 shrink-0" />
                    Télécharger le devis signé
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full mx-auto max-w-[1600px] min-w-0 pb-12 sm:pb-24 px-0 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* Colonne de gauche : Aperçu du devis (Large) */}
            <div className="w-full min-w-0 space-y-6">
              <QuoteViewer
                pdfUrl={quote.pdfUrl}
                createdAt={quote.createdAt}
                summary={{
                  total: "1 490,00 €",
                  deliveryTime: "2-4 semaines",
                  services: ["Site web personnalisé", "Design sur-mesure", "Optimisation SEO", "Support 3 mois"]
                }}
              />
            </div>

            {/* Colonne de droite : Signature (Sticky sur Desktop) */}
            <div className="w-full min-w-0">
              <div className="lg:sticky lg:top-24 space-y-6">

                {/* Bloc Signature */}
                <QuoteSignForm
                  quoteId={id}
                  projectDetails={{
                    name: projectName,
                    total: "1 490,00 €",
                    delay: "2-4 semaines"
                  }}
                />

              </div>
            </div>
          </div>

          {/* Section Full Width en bas (Timeline, Trust, FAQ) */}
          <div className="mt-12 space-y-12">
            <QuoteTimeline />
            <div className="space-y-8">
              <QuoteTrustSection />
              <QuoteFAQ />
            </div>
          </div>

        </div>
      )}
      <ChatWidgetClient />
    </>
  );
}
