import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import Script from "next/script";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWidgetClient } from "@/components/chat/chat-widget-client";
import { CheckCircle2, Circle, Clock, FileText, Image as ImageIcon, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      <div className="w-full safe-px min-w-0 pb-20 pt-8 sm:pt-12">
        <div className="mx-auto w-full max-w-4xl space-y-6">

          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Votre démo est en cours de préparation
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Nous créons votre site de démonstration personnalisé à partir de vos informations.
            </p>
          </div>

          {/* Hero Status Card */}
          <Card className="border-blue-100 bg-gradient-to-b from-blue-50/50 to-white shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 ring-8 ring-blue-50">
                <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-blue-950">
                Merci ! C&apos;est parti 🚀
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-blue-800/80 mt-2 max-w-xl mx-auto">
                Nous avons bien reçu vos informations pour <span className="font-semibold text-blue-900">{projectName}</span>.
                Notre équipe s&apos;occupe de tout.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 pt-6">
              {/* Visual Timeline */}
              <div className="relative mx-auto max-w-2xl">
                <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-slate-200" />

                <div className="space-y-8 relative">
                  {/* Step 1: Done */}
                  <div className="flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 ring-4 ring-white">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-slate-900">Onboarding complété</h3>
                      <p className="text-sm text-slate-500">Nous avons toutes les informations nécessaires.</p>
                    </div>
                  </div>

                  {/* Step 2: Active */}
                  <div className="flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 ring-4 ring-blue-100 shadow-lg shadow-blue-200">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-blue-700">Création en cours</h3>
                      <p className="text-sm text-blue-600/80">
                        Design, intégration et rédaction de vos contenus.
                        <br />
                        <span className="inline-block mt-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          ~24h ouvrées
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Pending */}
                  <div className="flex gap-4 opacity-60">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white border border-slate-200">
                      <Circle className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-slate-700">Livraison de la démo</h3>
                      <p className="text-sm text-slate-500">Vous recevrez un email dès que c&apos;est prêt.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Section */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50 bg-white/50 hover:bg-white transition-colors">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Vos services</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Préparez la liste de vos prestations et leurs tarifs.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-white/50 hover:bg-white transition-colors">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Vos visuels</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rassemblez vos logos et belles photos si vous en avez.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-white/50 hover:bg-white transition-colors">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Patience...</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    On fait au plus vite ! Profitez-en pour vous détendre.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

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

          {/* Contact Section */}
          <Card className="bg-slate-900 text-white border-none shadow-lg overflow-hidden relative">
            {/* Background pattern or gradient for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800" />

            <CardContent className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left space-y-1">
                <h3 className="font-semibold text-lg text-white">Une question urgente ?</h3>
                <p className="text-slate-300 text-sm">
                  Notre équipe est disponible pour vous répondre.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  asChild
                  className="bg-[#25D366] hover:bg-[#1DA851] text-white border-none w-full sm:w-auto font-semibold shadow-md"
                  size="lg"
                >
                  <a
                    href="https://wa.me/33613554022?text=Bonjour%20Lucas%2C%20j%27attends%20ma%20d%C3%A9mo%20Orylis%20et%20j%27aimerais%20%C3%A9changer%20%C3%A0%20propos%20de%20mon%20site."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white w-full sm:w-auto backdrop-blur-sm"
                  size="lg"
                >
                  <a href="mailto:contact@orylis.fr">
                    contact@orylis.fr
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      <ChatWidgetClient />
      {/* Facebook Pixel - Lead on demo-in-progress (formulaire complété) */}
      <Script id="fb-lead" strategy="afterInteractive">
        {`if (typeof fbq === 'function') { try { fbq('track', 'Lead'); } catch(e) {} }`}
      </Script>
    </>
  );
}
