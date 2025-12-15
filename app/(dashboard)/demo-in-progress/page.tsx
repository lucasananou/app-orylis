import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import Script from "next/script";
import { Card, CardContent } from "@/components/ui/card";
import { ChatWidgetClient } from "@/components/chat/chat-widget-client";
import { CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StickyContactBar } from "@/components/dashboard/sticky-contact-bar";

// Cache 30 secondes : le statut de la démo change peu
export const revalidate = 30;

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
      <div className="w-full safe-px min-w-0 pb-32 pt-8 sm:pt-12">
        <div className="mx-auto w-full max-w-4xl space-y-6">

          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Votre démo est en cours de création 🎨
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Nous construisons votre site de démonstration sur-mesure.
              <br />
              <span className="font-medium text-blue-600">
                Vous recevrez votre lien d&apos;accès par email d&apos;ici 2 heures environ.
              </span>
            </p>
          </div>

          {/* Hero Status Card */}
          <Card className="border-blue-100 bg-white shadow-lg shadow-blue-900/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <CardContent className="pb-8 pt-8">
              {/* Visual Timeline */}
              <div className="relative mx-auto max-w-xl">
                <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-slate-100" />

                <div className="space-y-10 relative">
                  {/* Step 1: Done */}
                  <div className="flex gap-5">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 ring-4 ring-white">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold text-slate-900">Informations reçues</h3>
                      <p className="text-slate-500">Nous avons bien reçu le dossier de <span className="font-medium text-slate-900">{projectName}</span>.</p>
                    </div>
                  </div>

                  {/* Step 2: Active */}
                  <div className="flex gap-5">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 ring-4 ring-blue-100 shadow-xl shadow-blue-200">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold text-blue-700">Création en cours...</h3>
                      <p className="text-blue-600/90 mb-2">
                        Nos designers et développeurs construisent votre première version.
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                        <Clock className="h-3.5 w-3.5" />
                        Temps estimé : ~2 heures
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Pending */}
                  <div className="flex gap-5 opacity-60">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 ring-4 ring-white border border-slate-200">
                      <Circle className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold text-slate-700">Livraison par email</h3>
                      <p className="text-slate-500">Surveillez votre boîte mail, ça arrive vite !</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 text-center">Questions fréquentes</h3>
            <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Combien de temps prend la création de ma démo ?</AccordionTrigger>
                    <AccordionContent>
                      En général, nous vous envoyons votre première démo sous 24 à 48h ouvrées après la réception de vos informations.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Est-ce que je m'engage à payer maintenant ?</AccordionTrigger>
                    <AccordionContent>
                      Non, absolument pas. La démo est gratuite et sans engagement. Vous ne signez le devis que si le résultat vous plaît.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Pourrai-je modifier le site après la livraison ?</AccordionTrigger>
                    <AccordionContent>
                      Oui ! Une fois le site en ligne, vous aurez accès à un éditeur simple pour modifier vos textes et photos vous-même.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Que dois-je préparer en attendant ?</AccordionTrigger>
                    <AccordionContent>
                      L'idéal est de rassembler vos plus belles photos, votre logo (si vous en avez un) et une liste claire de vos tarifs. Cela nous aidera à finaliser le site plus vite.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
      <StickyContactBar />
      <ChatWidgetClient />
      {/* Facebook Pixel - Lead on demo-in-progress (formulaire complété) */}
      <Script id="fb-lead" strategy="afterInteractive">
        {`if (typeof fbq === 'function') { try { fbq('track', 'Lead'); } catch(e) {} }`}
      </Script>
    </>
  );
}
