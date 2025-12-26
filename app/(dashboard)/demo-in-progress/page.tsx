import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import Script from "next/script";
import { Card, CardContent } from "@/components/ui/card";
import { ChatWidgetClient } from "@/components/chat/chat-widget-client";
// import { CheckCircle2 } from "lucide-react"; // Removed as unused
import { StickyContactBar } from "@/components/dashboard/sticky-contact-bar";

// Cache 30 secondes
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
      <div className="w-full h-full min-h-[85vh] flex flex-col items-center justify-center p-4">

        {/* Clean Calendly Embed (No Card borders) */}
        <div className="w-full max-w-[1060px] h-[700px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          <div
            className="calendly-inline-widget w-full h-full"
            data-url="https://calendly.com/lucas-orylis/30min?hide_event_type_details=1&hide_gdpr_banner=1"
          />
          <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
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
