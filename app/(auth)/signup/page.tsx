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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16 xl:gap-20">
          {/* Mobile: Formulaire en premier (order-1), Desktop: à droite (order-2) */}
          <div className="order-1 lg:order-2">
            <SignupCard />
          </div>

          {/* Mobile: Hero en dessous (order-2), Desktop: Hero à gauche (order-1) */}
          <div className="order-2 lg:order-1">
            <HeroSection />
          </div>
        </div>
      </div>
    </main>
  );
}

