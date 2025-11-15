import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, CreditCard } from "lucide-react";

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
    demoUrl: project.demoUrl
  };
}

export default async function DemoPage(): Promise<JSX.Element> {
  const { projectName, demoUrl } = await loadDemoData();

  return (
    <>
      <PageHeader
        title="Votre démo est prête !"
        description="Découvrez votre site de démonstration personnalisé et passez à l'étape suivante."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Bloc 1 : Aperçu de la démo */}
        <Card className="border border-border/70 bg-white shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Aperçu de votre démo
            </CardTitle>
            <CardDescription>
              Votre site de démonstration pour le projet <strong>{projectName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/50 bg-muted/20">
              <iframe
                src={demoUrl}
                className="h-full w-full"
                title={`Démo ${projectName}`}
                allow="fullscreen"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir la démo dans un nouvel onglet
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Bloc 2 : Options d'action */}
        <div className="space-y-6">
          {/* Message FOMO */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-semibold text-orange-900">
                    Validez votre site aujourd&apos;hui et profitez de votre mise en ligne prioritaire.
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    Les projets validés aujourd&apos;hui bénéficient d&apos;un traitement en priorité pour une mise en ligne rapide.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white shadow-subtle">
            <CardHeader>
              <CardTitle>Prochaines étapes</CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez avancer avec votre projet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                size="lg"
                className="w-full bg-[#1F66FF] text-white transition-all duration-200 hover:bg-[#1553CC] hover:shadow-md"
                asChild
              >
                <a
                  href="https://buy.stripe.com/aFafZh02O6yJf7H3DOgIo0p"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Valider mon site et passer à la suite
                </a>
              </Button>
              <Button size="lg" variant="outline" className="w-full" asChild>
                <a
                  href="https://calendly.com/lucas-orylis/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Prendre rendez-vous avec Lucas
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Bloc 3 : Informations */}
          <Card className="border border-accent/30 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg">Ce qui est inclus</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-accent">✓</span>
                  <span>
                    <strong className="text-foreground">Suivi de projet complet</strong> – Accès à
                    votre espace client pour suivre l'avancement
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-accent">✓</span>
                  <span>
                    <strong className="text-foreground">Système de tickets</strong> – Échangez
                    directement avec l'équipe Orylis
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-accent">✓</span>
                  <span>
                    <strong className="text-foreground">Gestion de fichiers</strong> – Partagez vos
                    contenus et ressources facilement
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-accent">✓</span>
                  <span>
                    <strong className="text-foreground">Support dédié</strong> – Accompagnement
                    personnalisé tout au long du projet
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

