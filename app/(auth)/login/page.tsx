import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PasswordLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<JSX.Element> {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 items-center justify-center bg-gradient-to-br from-[#F7F9FB] via-white to-[#E6F4F5] px-6 py-16 md:grid-cols-[0.9fr_1fr] md:px-20">
      <section className="hidden flex-col justify-center gap-8 text-slate-800 md:flex">
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
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900">
            Bienvenue sur votre espace client Orylis 🌐
          </h1>
          <p className="max-w-lg text-lg text-slate-600">
            Suivez la création et la gestion de votre site internet en toute simplicité.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-base text-slate-700">Cet espace vous permet de :</p>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Suivre l'avancement de votre projet en temps réel.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Transmettre vos contenus et valider les étapes de création.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Échanger avec l'équipe Orylis via le système de tickets.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Accéder à vos fichiers et factures à tout moment.</span>
            </li>
          </ul>
        </div>
        <p className="text-base text-slate-700">
          Vous êtes entre de bonnes mains 🤝
        </p>
        <p className="text-sm text-slate-600">
          Connectez-vous pour découvrir l'avancement de votre site.
        </p>
      </section>
      <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-[#F9FAFB] p-10 shadow-subtle">
        <div className="mb-8 space-y-3 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Connexion</h2>
        </div>
        <PasswordLoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Besoin d'aide ? Écrivez-nous à{" "}
          <Link href="mailto:hello@orylis.fr" className="font-medium text-accent hover:underline">
            hello@orylis.fr
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground/70">
          🔐 Connexion sécurisée – Vos données sont protégées et utilisées uniquement pour le suivi
          de votre projet.
        </p>
      </section>
    </div>
  );
}

