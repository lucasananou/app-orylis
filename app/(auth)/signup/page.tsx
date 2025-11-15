import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage(): Promise<JSX.Element> {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 items-center justify-center bg-gradient-to-br from-[#F7F9FB] via-white to-[#E6F4F5] px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[0.9fr_1fr] md:px-12 md:py-16 lg:px-20">
      <section className="hidden flex-col justify-center gap-6 text-slate-800 md:flex md:gap-8">
        <div className="flex items-center gap-3">
          <Image
            src="https://orylis.fr/wp-content/uploads/2023/08/Frame-454507529-1.png"
            alt="Orylis"
            width={120}
            height={40}
            className="h-auto w-auto"
            priority
          />
        </div>
        <div className="space-y-3 md:space-y-4">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Créez votre espace Orylis 🚀
          </h1>
          <p className="max-w-lg text-base text-slate-600 md:text-lg">
            Commencez votre parcours pour obtenir une démo personnalisée de votre futur site internet.
          </p>
        </div>
        <div className="space-y-2 md:space-y-3">
          <p className="text-sm text-slate-700 md:text-base">En créant votre compte, vous pourrez :</p>
          <ul className="space-y-2 text-sm text-slate-600 md:space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Remplir votre formulaire d'onboarding en quelques minutes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Recevoir une démo personnalisée de votre site.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Suivre l'avancement de votre projet en temps réel.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Échanger avec l'équipe Orylis via le système de tickets.</span>
            </li>
          </ul>
        </div>
        <p className="text-sm text-slate-700 md:text-base">
          C'est rapide, simple et sans engagement 🤝
        </p>
      </section>
      <section className="mx-auto w-full max-w-md rounded-2xl border border-border bg-[#F9FAFB] p-6 shadow-subtle sm:rounded-3xl sm:p-8 md:p-10">
        <div className="mb-6 space-y-2 text-center sm:mb-8 sm:space-y-3">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Créer votre espace
          </h2>
          <p className="text-sm text-muted-foreground">
            Remplissez le formulaire ci-dessous pour commencer
          </p>
        </div>
        <SignupForm />
        <p className="mt-4 text-center text-xs text-muted-foreground sm:mt-6">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/terms" className="font-medium text-accent hover:underline">
            conditions d'utilisation
          </Link>
        </p>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/80 sm:mt-4 sm:text-xs">
          🔐 Inscription sécurisée – Vos données sont protégées et utilisées uniquement pour le suivi
          de votre projet.
        </p>
      </section>
    </div>
  );
}

