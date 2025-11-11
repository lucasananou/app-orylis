import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MagicLinkLoginForm, PasswordLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<JSX.Element> {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 items-center justify-center bg-gradient-to-br from-[#F7F9FB] via-white to-[#E6F4F5] px-6 py-16 md:grid-cols-[0.8fr_1fr] md:px-20">
      <section className="hidden flex-col gap-6 text-slate-800 md:flex">
        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Orylis</span>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">
          Bienvenue sur Orylis Hub
        </h1>
        <p className="max-w-md text-base text-slate-600">
          Suivez vos projets, partagez vos ressources et collaborez avec l’équipe Orylis dans un
          espace unique et sécurisé.
        </p>
        <div className="rounded-3xl border border-border bg-white/80 p-8 shadow-subtle backdrop-blur">
          <ul className="space-y-4 text-sm text-slate-600">
            <li>
              <strong className="text-slate-900">Onboarding ultra fluide</strong> pour lancer vos
              projets sans friction.
            </li>
            <li>
              <strong className="text-slate-900">Tickets clairs</strong> pour synchroniser les
              demandes produit & design.
            </li>
            <li>
              <strong className="text-slate-900">Fichiers centralisés</strong> et liens de
              facturation accessibles à tout moment.
            </li>
          </ul>
        </div>
      </section>
      <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white/90 p-10 shadow-subtle backdrop-blur">
        <div className="mb-8 space-y-3 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Connexion sécurisée</h2>
          <p className="text-sm text-muted-foreground">
            Choisissez votre méthode de connexion&nbsp;: lien magique par email ou mot de passe.
          </p>
        </div>
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Connexion par lien magique
              </h3>
              <p className="text-xs text-muted-foreground">
                Nous t’envoyons un lien unique, valable quelques minutes.
              </p>
            </div>
            <MagicLinkLoginForm />
          </section>

          <div className="h-px bg-border" />

          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Connexion par mot de passe
              </h3>
              <p className="text-xs text-muted-foreground">
                Compte démo disponible : <strong>demo@orylis.app</strong> /{" "}
                <strong>OrylisDemo1!</strong>
              </p>
            </div>
            <PasswordLoginForm />
          </section>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Besoin d’aide ?{" "}
          <Link href="mailto:hello@orylis.fr" className="font-medium text-accent hover:underline">
            hello@orylis.fr
          </Link>
        </p>
      </section>
    </div>
  );
}

