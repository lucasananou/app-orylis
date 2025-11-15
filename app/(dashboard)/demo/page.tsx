import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, quotes } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, CreditCard } from "lucide-react";
import { GenerateQuoteButton } from "@/components/quote/generate-quote-button";

export const dynamic = "force-dynamic";

async function loadDemoData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;

  if (!isProspect(user.role)) {
    redirect("/");
  }

  // Récupérer le projet du prospect
  const project = await db.query.projects.findFirst({
    where: eq(projects.ownerId, user.id),
    columns: {
      id: true,
      name: true,
      status: true,
      demoUrl: true
    },
    orderBy: (projects, { asc }) => [asc(projects.createdAt)]
  });

  // Vérifier si un devis existe déjà
  const existingQuote = project
    ? await db.query.quotes.findFirst({
        where: eq(quotes.projectId, project.id),
        columns: {
          id: true
        }
      })
    : null;

  if (!project) {
    redirect("/onboarding");
  }

  // Si pas de démo URL, rediriger selon le statut
  if (!project.demoUrl) {
    if (project.status === "onboarding") {
      redirect("/onboarding");
    }
    if (project.status === "demo_in_progress") {
      redirect("/demo-in-progress");
    }
    redirect("/");
  }

  return {
    projectName: project.name,
    demoUrl: project.demoUrl,
    projectId: project.id,
    existingQuoteId: existingQuote?.id ?? null
  };
}

export default async function DemoPage(): Promise<JSX.Element> {
  const { projectName, demoUrl, projectId, existingQuoteId } = await loadDemoData();

  return (
    <>
      <PageHeader
        title="Votre démo est prête !"
        description="Découvrez votre site de démonstration personnalisé et passez à l'étape suivante."
      />

      <div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr] w-full">
          {/* Bloc 1 : Aperçu de la démo */}
          <Card className="border border-border/70 bg-white shadow-subtle w-full">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl break-words">
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                Aperçu de votre démo
              </CardTitle>
              <CardDescription className="text-sm sm:text-base break-words">
                Votre site de démonstration pour le projet <strong className="break-words">{projectName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="w-full rounded-lg border-2 border-border/60 bg-muted/10 shadow-lg sm:rounded-xl">
                <div className="relative w-full aspect-[16/9]">
                  <iframe
                    src={demoUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    title={`Démo ${projectName}`}
                    allow="fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>
              </div>
              <Button variant="outline" size="lg" className="w-full text-sm sm:text-base" asChild>
                <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  Ouvrir la démo dans un nouvel onglet
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Bloc 2 : Options d'action */}
          <div className="space-y-4 sm:space-y-6 w-full">
            {/* Message FOMO */}
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-md w-full">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl shrink-0">⚡</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-orange-900 sm:text-base break-words">
                      Validez votre site aujourd&apos;hui et réservez votre créneau de mise en ligne.
                    </p>
                    <p className="mt-1 text-xs text-orange-700 sm:text-sm break-words">
                      Les projets validés aujourd&apos;hui passent en priorité pour une mise en ligne rapide.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-white shadow-subtle w-full">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg break-words">Prochaines étapes</CardTitle>
                <CardDescription className="text-xs sm:text-sm break-words">
                  Choisissez comment vous souhaitez avancer avec votre projet
                </CardDescription>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm break-words">
                  Choisissez comment vous souhaitez avancer, vous gardez la main sur la suite du projet.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <GenerateQuoteButton projectId={projectId} existingQuoteId={existingQuoteId} />
                <Button
                  size="lg"
                  className="w-full bg-[#1F66FF] text-white transition-all duration-200 hover:bg-[#1553CC] hover:shadow-lg hover:-translate-y-[1px] text-sm sm:text-base"
                  asChild
                >
                  <a
                    href="https://buy.stripe.com/aFafZh02O6yJf7H3DOgIo0p"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CreditCard className="mr-2 h-4 w-4 shrink-0" />
                    Valider mon site et passer à la suite
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="w-full text-sm sm:text-base" asChild>
                  <a
                    href="https://calendly.com/lucas-orylis/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Calendar className="mr-2 h-4 w-4 shrink-0" />
                    Prendre rendez-vous avec Lucas
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Bloc 3 : Informations */}
            <Card className="border border-accent/30 bg-accent/5 w-full">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg break-words">Ce qui est inclus</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-muted-foreground sm:space-y-2 sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="break-words flex-1">
                      <strong className="text-foreground">Suivi de projet complet</strong> – Accès à
                      votre espace client pour suivre l&apos;avancement
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="break-words flex-1">
                      <strong className="text-foreground">Système de tickets</strong> – Échangez
                      directement avec l&apos;équipe Orylis
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="break-words flex-1">
                      <strong className="text-foreground">Gestion de fichiers</strong> – Partagez vos
                      contenus et ressources facilement
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="break-words flex-1">
                      <strong className="text-foreground">Support dédié</strong> – Accompagnement
                      personnalisé tout au long du projet
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-xs text-muted-foreground sm:text-sm break-words">
                  Tout est centralisé dans votre espace Orylis, vous n&apos;avez plus à courir après les infos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

