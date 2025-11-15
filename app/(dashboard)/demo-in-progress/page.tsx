import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoInProgressAnimated } from "@/components/dashboard/demo-in-progress-animated";

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
      <Card className="border border-border/70 bg-white shadow-subtle">
        <CardHeader>
          <div className="flex items-center gap-6">
            <DemoInProgressAnimated />
            <div className="flex-1">
              <CardTitle className="text-2xl">Votre démo est en cours de création ⚙️</CardTitle>
              <CardDescription className="mt-2 text-base">
                Nous préparons votre site de démonstration personnalisé pour le projet{" "}
                <span className="font-semibold text-foreground">{projectName}</span>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Que se passe-t-il maintenant ?
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-accent">✓</span>
                <span>
                  <strong className="text-foreground">Votre onboarding est complété</strong> – Nous
                  avons toutes les informations nécessaires pour créer votre démo.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-accent">⚙️</span>
                <span>
                  <strong className="text-foreground">Notre équipe travaille sur votre démo</strong>{" "}
                  – Nous créons un site personnalisé basé sur vos réponses.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-accent">📧</span>
                <span>
                  <strong className="text-foreground">Vous serez notifié</strong> – Dès que votre
                  démo sera prête, vous recevrez une notification et pourrez la consulter ici.
                </span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-6">
            <p className="text-sm text-blue-900">
              <strong>💡 Besoin d'aide ?</strong> N'hésitez pas à nous contacter à{" "}
              <a
                href="mailto:hello@orylis.fr"
                className="font-medium text-blue-700 underline hover:text-blue-800"
              >
                hello@orylis.fr
              </a>{" "}
              ou à{" "}
              <a
                href="https://calendly.com/lucas-orylis/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-700 underline hover:text-blue-800"
              >
                prendre rendez-vous avec Lucas
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

