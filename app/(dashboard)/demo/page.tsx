import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, quotes } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
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
    <div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Titre + sous-titre */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
          Votre démo est prête !
        </h1>
        <p className="text-xs text-slate-600 sm:text-sm md:text-base">
          Découvrez votre site de démonstration personnalisé et passez à l&apos;étape suivante.
        </p>
      </div>

        {/* Layout desktop : colonnes à partir de lg */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[3fr,2fr]">
          {/* Colonne gauche : Aperçu de la démo */}
          <div className="space-y-4 sm:space-y-6 w-full">
            {/* Carte "Aperçu de votre démo" */}
            <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
                    <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    Aperçu de votre démo
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 sm:text-base">
                    Votre site de démonstration pour le projet <strong>{projectName}</strong>
                  </p>
                </div>

                {/* Conteneur de l'aperçu */}
                <div className="w-full overflow-hidden rounded-2xl border border-slate-100">
                  <iframe
                    src={demoUrl}
                    className="w-full h-[220px] sm:h-[280px] md:h-[320px] border-0"
                    title={`Démo ${projectName}`}
                    allow="fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>

                {/* Bouton "Ouvrir la démo dans un nouvel onglet" */}
                <Button variant="outline" size="lg" className="w-full text-sm sm:text-base" asChild>
                  <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    Ouvrir la démo dans un nouvel onglet
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Colonne droite : Actions et informations */}
          <div className="space-y-4 sm:space-y-6 w-full">
            {/* Bandeau orange (FOMO) */}
            <div className="w-full rounded-2xl sm:rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 p-4 sm:p-6 shadow-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl shrink-0">⚡</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-orange-900 sm:text-base">
                    Validez votre site aujourd&apos;hui et réservez votre créneau de mise en ligne.
                  </p>
                  <p className="mt-1 text-xs text-orange-700 sm:text-sm">
                    Les projets validés aujourd&apos;hui passent en priorité pour une mise en ligne rapide.
                  </p>
                </div>
              </div>
            </div>

            {/* Carte "Prochaines étapes" */}
            <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Prochaines étapes</h2>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                    Choisissez comment vous souhaitez avancer avec votre projet
                  </p>
                  <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                    Choisissez comment vous souhaitez avancer, vous gardez la main sur la suite du projet.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
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
                </div>
              </div>
            </div>

            {/* Carte "Ce qui est inclus" */}
            <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Ce qui est inclus</h2>
                <ul className="space-y-2 text-xs text-slate-600 sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="flex-1">
                      <strong className="text-slate-900">Suivi de projet complet</strong> – Accès à
                      votre espace client pour suivre l&apos;avancement
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="flex-1">
                      <strong className="text-slate-900">Système de tickets</strong> – Échangez
                      directement avec l&apos;équipe Orylis
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="flex-1">
                      <strong className="text-slate-900">Gestion de fichiers</strong> – Partagez vos
                      contenus et ressources facilement
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-accent shrink-0">✓</span>
                    <span className="flex-1">
                      <strong className="text-slate-900">Support dédié</strong> – Accompagnement
                      personnalisé tout au long du projet
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-xs text-slate-500 sm:text-sm">
                  Tout est centralisé dans votre espace Orylis, vous n&apos;avez plus à courir après les infos.
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

