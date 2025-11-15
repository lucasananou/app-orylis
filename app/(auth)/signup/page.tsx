import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HeroSection } from "@/components/auth/hero-section";
import { SignupCard } from "@/components/auth/signup-card";

export const dynamic = "force-dynamic";

export default async function SignupPage(): Promise<JSX.Element> {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12 lg:px-12 lg:py-20">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16 xl:gap-20">
          {/* Mobile: Formulaire en premier (order-1), Desktop: à droite (order-2) */}
          <div className="order-1 min-w-0 lg:order-2">
            <SignupCard />
          </div>

          {/* Mobile: Hero en dessous (order-2), Desktop: Hero à gauche (order-1) */}
          <div className="order-2 min-w-0 lg:order-1 relative">
            {/* Gradient très léger en fond du hero */}
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-slate-100/50 via-transparent to-blue-50/30 lg:-left-8 lg:-right-8 lg:-top-4 lg:-bottom-4" />
            <HeroSection />
          </div>
        </div>
      </div>
    </main>
  );
}

