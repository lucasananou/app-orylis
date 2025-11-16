import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoInProgressAnimated } from "@/components/dashboard/demo-in-progress-animated";
import ChatWidget from "@/components/chat/ChatWidget";

export const dynamic = "force-dynamic";

async function loadDemoStatus() {
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

  // Si la démo est prête, rediriger vers la page de conversion
  if (project.demoUrl) {
    redirect("/demo");
  }

  // Si le statut n'est pas demo_in_progress, rediriger selon le statut
  if (project.status === "onboarding") {
    redirect("/onboarding");
  }

  if (project.status !== "demo_in_progress") {
    redirect("/");
  }

  return { projectName: project.name };
}

export default async function DemoInProgressPage(): Promise<JSX.Element> {
  const { projectName } = await loadDemoStatus();

  return (
    <>
      <PageHeader
        title="Votre démo est en création"
        description="Nous préparons votre site de démonstration à partir de vos informations."
      />
      <div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border border-border/70 bg-white shadow-subtle">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="shrink-0">
                <DemoInProgressAnimated />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <CardTitle className="text-xl sm:text-2xl break-words">Votre démo est en cours de création ⚙️</CardTitle>
                <CardDescription className="mt-2 text-sm sm:text-base break-words">
                  Nous préparons votre site de démonstration personnalisé pour le projet{" "}
                  <span className="font-semibold text-foreground">{projectName}</span>.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4 sm:rounded-2xl sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-foreground sm:mb-4 sm:text-lg break-words">
                Que se passe-t-il maintenant ?
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground sm:space-y-3 sm:text-sm">
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="mt-1 text-accent shrink-0">✓</span>
                  <span className="break-words flex-1">
                    <strong className="text-foreground">Votre onboarding est complété</strong> – Nous
                    avons toutes les informations nécessaires pour créer votre démo.
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="mt-1 text-accent shrink-0">⚙️</span>
                  <span className="break-words flex-1">
                    <strong className="text-foreground">Notre équipe travaille sur votre démo</strong>{" "}
                    – Nous créons un site personnalisé basé sur vos réponses.
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="mt-1 text-accent shrink-0">📧</span>
                  <span className="break-words flex-1">
                    <strong className="text-foreground">Vous serez notifié</strong> – Dès que votre
                    démo sera prête, vous recevrez une notification et pourrez la consulter ici.
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 sm:rounded-2xl sm:p-6">
              <p className="text-xs text-blue-900 sm:text-sm break-words">
                <strong>💡 Besoin d&apos;aide ?</strong> N&apos;hésitez pas à nous contacter à{" "}
                <a
                  href="mailto:hello@orylis.fr"
                  className="font-medium text-blue-700 underline hover:text-blue-800 break-all inline"
                >
                  hello@orylis.fr
                </a>{" "}
                ou à{" "}
                <a
                  href="https://calendly.com/lucas-orylis/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-700 underline hover:text-blue-800 break-all inline"
                >
                  prendre rendez-vous avec Lucas
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <ChatWidget />
    </>
  );
}

