import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteSignForm } from "@/components/quote/quote-sign-form";
import { QuoteViewer } from "@/components/quote/quote-viewer";
import { CheckCircle2, Download } from "lucide-react";

export const dynamic = "force-dynamic";

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
        <Card className="border border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-lg text-green-900">Devis signé !</CardTitle>
                <CardDescription className="text-green-700">
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
              <Button asChild className="text-sm sm:text-base">
                <a href={quote.signedPdfUrl!} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le devis signé
                </a>
              </Button>
              <Button variant="outline" asChild className="text-sm sm:text-base">
                <a href="/demo">
                  Retour à la démo
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Colonne de gauche : Aperçu du devis */}
          <div>
            <QuoteViewer pdfUrl={quote.pdfUrl} createdAt={quote.createdAt} />
          </div>

          {/* Colonne de droite : Signature + Bloc "après validation" */}
          <div className="space-y-4 sm:space-y-6">
            <QuoteSignForm quoteId={id} />
            <Card className="border border-accent/20 bg-gradient-to-br from-accent/5 to-blue-50/30">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <span>✨</span>
                  Après validation…
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Voici ce que nous allons faire :
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl">🚀</span>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">Nous lançons immédiatement la préparation de votre site final</p>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        Votre projet passe en phase de développement dès validation du devis.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl">📅</span>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">Vous recevez une date estimée de livraison</p>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        Nous vous communiquons un planning précis dans les 24h suivant la validation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl">💬</span>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">Vous accédez au système de tickets et échanges avec Lucas</p>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        Communication directe et suivi en temps réel de l'avancement de votre projet.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="mt-0.5 sm:mt-1 text-xl sm:text-2xl">📁</span>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">Vous pouvez envoyer vos contenus (photos, textes…)</p>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        Partagez facilement tous vos éléments via votre espace client sécurisé.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

