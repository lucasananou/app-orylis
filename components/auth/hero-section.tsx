import Image from "next/image";
import { Check } from "lucide-react";

export function HeroSection() {
  return (
    <section className="flex flex-col justify-center gap-8 text-slate-800 md:gap-10 lg:pr-8">
      {/* Logo */}
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

      {/* Titre principal */}
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
          Recevez une démo personnalisée de votre futur site en 24h 🚀
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl">
          Créez votre espace Orylis, répondez à quelques questions, et recevez une démo de site WordPress professionnelle, adaptée à votre activité.{" "}
          <span className="font-medium text-slate-700">Gratuit, sans engagement.</span>
        </p>
      </div>

      {/* Bullet points */}
      <div className="space-y-3">
        <ul className="space-y-3 text-base text-slate-700 md:space-y-3.5 md:text-lg">
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span>Formulaire d&apos;onboarding en 2 minutes</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span>Demo de votre futur site, personnalisée</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span>Design moderne, responsive, adapté à votre activité</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span>Accès à un espace client pour suivre votre projet</span>
          </li>
        </ul>
      </div>

      {/* Preuve sociale */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-900">⭐ 4,9/5</span>
          <span className="text-base text-slate-600">— Plus de 140 entrepreneurs accompagnés</span>
        </div>
        <SocialProof />
      </div>
    </section>
  );
}

function SocialProof() {
  // Placeholder pour les logos clients - à remplacer par de vrais logos plus tard
  const clientLogos = [
    { name: "Client 1", placeholder: "Logo" },
    { name: "Client 2", placeholder: "Logo" },
    { name: "Client 3", placeholder: "Logo" },
    { name: "Client 4", placeholder: "Logo" }
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <p className="text-sm font-medium text-slate-500">Ils nous font confiance :</p>
      <div className="flex flex-wrap items-center gap-3">
        {clientLogos.map((client, index) => (
          <div
            key={index}
            className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-400 shadow-sm"
          >
            {client.placeholder}
          </div>
        ))}
      </div>
    </div>
  );
}

