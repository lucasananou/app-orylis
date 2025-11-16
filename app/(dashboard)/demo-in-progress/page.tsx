import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        title="Votre démo est en cours de préparation"
        description="Nous créons votre site de démonstration personnalisé à partir de vos informations."
      />
      <div className="w-full px-4 sm:px-6 lg:px-8 min-w-0">
        <Card className="mx-auto w-full max-w-3xl border border-border/70 bg-white shadow-subtle">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-8">
            <div className="space-y-2 max-w-3xl min-w-0">
              <CardTitle className="text-base sm:text-xl break-words text-center sm:text-left">
                Merci ! Nous lançons la création de votre démo pour <span className="font-semibold">{projectName}</span> 🚀
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm break-words text-center sm:text-left">
                Vous avancerez automatiquement à l’étape suivante dès que la démo sera prête.
              </CardDescription>
            </div>
            <div className="mt-4">
              <ol className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 text-[11px] sm:justify-start sm:text-sm">
                <li className="flex items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-600">
                  Onboarding
                </li>
                <li className="flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                  Démo en cours
                </li>
                <li className="flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-400">
                  Démo prête
                </li>
              </ol>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-8 pb-24">
            <div className="mx-auto max-w-3xl rounded-xl border border-border/50 bg-muted/30 p-4 sm:rounded-2xl sm:p-6 min-w-0">
              <h3 className="mb-4 text-base font-semibold text-foreground sm:text-lg break-words text-center sm:text-left">
                Ce que nous faisons pour vous maintenant
              </h3>
              <ul className="space-y-3 text-xs text-muted-foreground sm:space-y-4 sm:text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0" aria-hidden>✅</span>
                  <span className="break-words flex-1">
                    <strong className="text-foreground">Onboarding complété</strong> – Nous avons toutes les informations nécessaires pour créer votre démo.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0" aria-hidden>⚙️</span>
                  <span className="break-words flex-1">
                    <strong className="text-foreground">Création en cours</strong> – Nous mettons en place une démo fidèle à votre activité et à vos préférences.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0" aria-hidden>🔔</span>
                  <span className="break-words flex-1">
                    <strong className="text-foreground">Notification dès que c’est prêt</strong> – Vous recevrez un message pour l’ouvrir ici même.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mx-auto max-w-3xl rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:rounded-2xl sm:p-6 min-w-0">
              <h4 className="mb-3 text-center text-sm font-semibold text-blue-900 sm:text-left sm:text-base">Et en attendant, vous pouvez :</h4>
              <ul className="list-disc space-y-2 pl-4 text-xs text-blue-900 sm:text-sm">
                <li>Préparer la liste de vos services et leurs tarifs.</li>
                <li>Noter les pages indispensables (ex. À propos, Services, Contact).</li>
                <li>Rassembler logos, photos et témoignages (si vous en avez).</li>
              </ul>
            </div>

            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 min-w-0">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div>
                  <p className="text-sm font-semibold text-foreground sm:text-base">
                    Besoin d’échanger sur votre projet ?
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Ou envoyez-nous un e‑mail à{" "}
                    <a href="mailto:hello@orylis.fr" className="font-medium text-blue-700 underline hover:text-blue-800 break-all inline">
                      hello@orylis.fr
                    </a>
                  </p>
                </div>
                <a
                  href="https://wa.me/33613554022?text=Bonjour%20Lucas%2C%20j%27attends%20ma%20d%C3%A9mo%20Orylis%20et%20j%27aimerais%20%C3%A9changer%20%C3%A0%20propos%20de%20mon%20site."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1DA851] sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.47 0 .11 5.36.11 11.95a11.86 11.86 0 0 0 1.67 6.07L0 24l6.11-1.76a11.9 11.9 0 0 0 5.94 1.6h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.2-3.49-8.41ZM12.06 21.34h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.63 1.05 1.04-3.54-.22-.36a9.43 9.43 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.43-9.43 2.52 0 4.88.98 6.66 2.76a9.38 9.38 0 0 1 2.77 6.66c0 5.2-4.23 9.43-9.46 9.43Zm5.19-7.05c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.65.14-.19.28-.74.91-.91 1.1-.17.19-.34.21-.62.07-.28-.14-1.17-.43-2.22-1.38-.82-.73-1.38-1.63-1.54-1.9-.16-.28-.02-.43.12-.57.12-.12.28-.31.43-.48.14-.17.19-.28.28-.48.09-.19.05-.36-.02-.5-.07-.14-.65-1.56-.88-2.13-.23-.55-.47-.47-.65-.48h-.55c-.19 0-.5.07-.76.36-.26.28-1 1-1 2.43 0 1.43 1.03 2.82 1.17 3.02.14.19 2.02 3.08 4.89 4.32.68.29 1.21.46 1.62.59.68.22 1.3.19 1.8.12.55-.08 1.66-.68 1.9-1.33.24-.64.24-1.19.17-1.33-.07-.14-.26-.21-.54-.36Z" />
                  </svg>
                  Parler avec Lucas sur WhatsApp
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ChatWidget />
    </>
  );
}

