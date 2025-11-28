import { redirect } from "next/navigation";
import Script from "next/script";
import { auth } from "@/auth";
import { HeroSection } from "@/components/auth/hero-section";
import { SignupCard } from "@/components/auth/signup-card";
import { StickyCTA } from "@/components/auth/sticky-cta";

export const dynamic = "force-dynamic";

export default async function SignupPage(): Promise<JSX.Element> {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 md:px-8 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          {/* Mobile: Formulaire en premier (order-1), Desktop: à droite (order-2) */}
          <div className="order-1 w-full min-w-0 lg:order-2">
            <SignupCard />
          </div>

          {/* Mobile: Hero en dessous (order-2), Desktop: Hero à gauche (order-1) */}
          <div className="order-2 w-full min-w-0 lg:order-1 relative">
            {/* Gradient très léger en fond du hero */}
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-slate-100/50 via-transparent to-blue-50/30 lg:-left-4 lg:-right-4 lg:-top-4 lg:-bottom-4" />
            <HeroSection />
          </div>
        </div>
      </div>

      {/* Facebook Pixel - ViewContent */}
      <Script id="fb-viewcontent" strategy="afterInteractive">
        {`if (typeof fbq === 'function') { try { fbq('track', 'ViewContent'); } catch(e) {} }`}
      </Script>

      {/* CTA Sticky Mobile */}
      <StickyCTA />
    </main>
  );
}

