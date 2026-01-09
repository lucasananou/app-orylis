import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, profiles, authUsers } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import Script from "next/script";
import { BookingWidget } from "@/components/booking/booking-widget";
import { ChatWidgetClient } from "@/components/chat/chat-widget-client";
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

  // Récupérer les infos du prospect pour pré-remplir le formulaire
  const [profile, authUser] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: {
        fullName: true,
        phone: true
      }
    }),
    db.query.authUsers.findFirst({
      where: eq(authUsers.id, user.id),
      columns: {
        email: true,
        name: true
      }
    })
  ]);

  return {
    projectName: project.name,
    prefillName: profile?.fullName || authUser?.name || "",
    prefillEmail: authUser?.email || "",
    prefillPhone: profile?.phone || ""
  };
}

export default async function DemoInProgressPage(): Promise<JSX.Element> {
  const { projectName, prefillName, prefillEmail, prefillPhone } = await loadDemoStatus();

  return (
    <>
      <div className="w-full h-full min-h-[85vh] flex flex-col items-center justify-center p-4">
        <BookingWidget
          prefillName={prefillName}
          prefillEmail={prefillEmail}
          prefillPhone={prefillPhone}
          variant="full"
        />
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
