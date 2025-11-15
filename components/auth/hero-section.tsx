import Image from "next/image";
import { Check } from "lucide-react";

export function HeroSection() {
  return (
    <section className="flex flex-col justify-center gap-6 text-slate-800 sm:gap-8 md:gap-10 lg:pr-8 min-w-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="https://orylis.fr/wp-content/uploads/2023/08/Frame-454507529-1.png"
          alt="Orylis"
          width={100}
          height={33}
          className="h-auto w-auto sm:w-[120px] sm:h-[40px]"
          priority
        />
      </div>

      {/* Titre principal */}
      <div className="space-y-2 sm:space-y-3">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="font-poppins text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl break-words">
            Recevez une démo personnalisée de votre futur site en 24h 🚀
          </h1>
          <p className="text-xs font-medium text-slate-500 sm:text-sm md:text-base">
            Plus de 140 entrepreneurs ont déjà testé leur futur site gratuitement avant d&apos;acheter.
          </p>
          {/* Sous-bullet point pour renforcer la valeur perçue */}
          <p className="text-xs text-slate-400 sm:text-sm">
            💬 Nos démos sont créées à partir de vos informations, pas des templates génériques.
          </p>
        </div>
        <p className="w-full text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg lg:text-xl break-words">
          Créez votre espace Orylis, répondez à quelques questions, et recevez une démo de site WordPress professionnelle, adaptée à votre activité.{" "}
          <span className="font-medium text-slate-700">Gratuit, sans engagement.</span>
        </p>
        {/* Badge de rapidité */}
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 sm:px-3 sm:py-1.5 md:text-sm">
          <span>⚡</span>
          <span>Démo créée en moyenne en 18h</span>
        </div>
      </div>

      {/* Bullet points */}
      <div className="space-y-2 sm:space-y-3">
        <ul className="space-y-2.5 text-sm text-slate-700 sm:space-y-3 sm:text-base md:text-lg">
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="break-words">Formulaire d&apos;onboarding en 2 minutes</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="break-words">Demo de votre futur site, personnalisée</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="break-words">Design moderne, responsive, adapté à votre activité</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="break-words">Accès à un espace client pour suivre votre projet</span>
          </li>
        </ul>
      </div>

      {/* Preuve sociale */}
      <div className="space-y-3 pt-2 sm:space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-base font-semibold text-slate-900 sm:text-lg">⭐ 4,9/5</span>
          <span className="text-sm text-slate-600 sm:text-base">— Plus de 140 entrepreneurs accompagnés</span>
        </div>
        <SocialProof />
      </div>
    </section>
  );
}

function SocialProof() {
  // Badges de partenaires/outils pour renforcer la crédibilité
  // Utilisation de noms de marques stylisés (plus sûr et efficace)
  const partnerBadges = [
    { name: "WordPress", color: "text-[#21759B]" },
    { name: "Shopify", color: "text-[#95BF47]" },
    { name: "Elementor", color: "text-[#92003B]" },
    { name: "Meta", color: "text-[#1877F2]" }
  ];

  return (
    <div className="space-y-2 pt-2">
      <p className="text-xs font-medium text-slate-500">Technologies maîtrisées :</p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {partnerBadges.map((partner, index) => (
          <div
            key={index}
            className={`flex h-8 sm:h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 sm:px-4 text-xs font-semibold shadow-sm transition-all hover:border-slate-300 hover:shadow-md shrink-0 ${partner.color}`}
            title={partner.name}
          >
            {partner.name}
          </div>
        ))}
      </div>
    </div>
  );
}

