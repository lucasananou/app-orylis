import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PasswordLoginForm } from "./login-form";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<JSX.Element> {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[0.9fr_1fr] md:px-8 md:py-16 lg:px-12 xl:px-24">
      {/* Left Column: Branding & Info */}
      <section className="hidden flex-col justify-center gap-8 pr-8 text-slate-800 md:flex lg:pr-16">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-orylis.png"
            alt="Orylis"
            width={160}
            height={53}
            className="h-auto w-auto"
            priority
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 lg:text-5xl">
            Bienvenue sur votre <br />
            <span className="text-blue-600">Espace Client</span>
          </h1>
          <p className="max-w-lg text-lg text-slate-600 leading-relaxed">
            Suivez la création et la gestion de votre site internet en toute simplicité, étape par étape.
          </p>
        </div>

        <div className="space-y-4">
          <p className="font-medium text-slate-900">Tout ce dont vous avez besoin :</p>
          <ul className="space-y-3 text-base text-slate-600">
            {[
              "Suivi de projet en temps réel",
              "Validation des étapes de création",
              "Support prioritaire via tickets",
              "Accès aux factures et documents"
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4">
          <p className="text-sm font-medium text-slate-500">
            Vous êtes entre de bonnes mains 🤝
          </p>
        </div>
      </section>

      {/* Right Column: Login Form */}
      <section className="mx-auto w-full max-w-[440px]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl sm:p-10 md:p-12">
          <div className="mb-8 space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
            <p className="text-sm text-slate-500">
              Accédez à votre dashboard pour gérer votre site
            </p>
          </div>

          <PasswordLoginForm />

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Ou</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-600">
              Toujours pas de site internet ?{" "}
              <Link href="/start" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Demander ma démo
              </Link>
            </p>

            <p className="text-center text-xs text-slate-400">
              Besoin d'aide ?{" "}
              <Link href="mailto:contact@orylis.fr" className="hover:text-slate-600 hover:underline">
                contact@orylis.fr
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
          🔒 Connexion sécurisée – Vos données sont protégées et confidentielles.
        </p>
      </section>
    </div>
  );
}
