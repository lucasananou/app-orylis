import Image from "next/image";
import { Check } from "lucide-react";

export function HeroSection() {
  return (
    <section className="flex flex-col justify-center gap-6 text-slate-800 sm:gap-8 md:gap-10 lg:pr-8 min-w-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo-orylis.png"
          alt="Orylis"
          width={100}
          height={33}
          className="h-auto w-auto sm:w-[120px] sm:h-[40px]"
          priority
        />
      </div>

      {/* Preuve sociale repositionnée en haut */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 sm:text-base">⭐ 4,9/5</span>
        <span className="text-xs text-slate-600 sm:text-sm">— 140+ entrepreneurs accompagnés</span>
      </div>

      {/* Titre principal - Focus sur le résultat business */}
      <div className="space-y-2 sm:space-y-3">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="font-poppins text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl break-words">
            Testez gratuitement un site qui vend à votre place
          </h1>
          <p className="text-sm font-medium text-slate-600 sm:text-base md:text-lg">
            Démo WordPress personnalisée, livrée en 24h.
          </p>
        </div>
        <p className="w-full text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg break-words">
          On crée un site WordPress de démo, pensé pour convertir, personnalisé pour votre activité. Vous testez, vous validez, on le met en ligne.
        </p>
        {/* Badge de rapidité */}
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 sm:px-3 sm:py-1.5 md:text-sm">
          <span>🔥</span>
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
            <span className="break-words">Création de compte ultra-simple</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="break-words">Accès à un espace client pour suivre l&apos;avancement</span>
          </li>
        </ul>
      </div>

      {/* Qualification du prospect - IMMÉDIATEMENT après les bullets (above the fold) */}
      <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 sm:p-4">
        <p className="text-sm font-semibold text-slate-900 sm:text-base">Sites que nous créons :</p>
        <ul className="space-y-1.5 text-xs text-slate-700 sm:text-sm">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Sites vitrines pro (artisans, consultants, thérapeutes…)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Boutiques en ligne WordPress + WooCommerce</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Pages de vente optimisées pour la conversion</span>
          </li>
        </ul>
        <p className="pt-1.5 text-xs font-medium text-slate-900 sm:text-sm">
          Nos tarifs : à partir de 1490 € le site complet — tarif clair, aucun frais caché, pas d&apos;abonnement forcé, le site vous appartient.
        </p>
      </div>

      {/* Exemples de sites livrés */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Aperçu de démos créées</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Artisan */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="aspect-video w-full overflow-hidden rounded-md">
              <Image
                src="https://orylis.fr/wp-content/uploads/2025/05/Realisation61-1.webp"
                alt="Site vitrine - Boulangerie Simon"
                width={400}
                height={225}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-medium text-slate-900">Site vitrine : Gorank.fr</p>
            <p className="text-xs text-slate-600">Agence de référencement naturel</p>
          </div>

          {/* Coach */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="aspect-video w-full overflow-hidden rounded-md">
              <Image
                src="https://orylis.fr/wp-content/uploads/2025/05/Frame-454507480.png"
                alt="Coach business - Stéphane"
                width={400}
                height={225}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-medium text-slate-900">Coach business : Stéphane</p>
            <p className="text-xs text-slate-600">+42 demandes en 3 mois</p>
          </div>

          {/* Immobilier */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="aspect-video w-full overflow-hidden rounded-md">
              <Image
                src="https://orylis.fr/wp-content/uploads/2025/05/Frame-454507480-2.png"
                alt="Ticket Immo - Site immobilier"
                width={400}
                height={225}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-medium text-slate-900">Ticket Immo : Site immobilier</p>
            <p className="text-xs text-slate-600">Site optimisé conversion</p>
          </div>
        </div>
      </div>

      {/* Pourquoi Orylis ? */}
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 sm:p-4">
        <p className="text-sm font-semibold text-slate-900 sm:text-base">Pourquoi Orylis ?</p>
        <ul className="space-y-1.5 text-xs text-slate-700 sm:text-sm">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Spécialistes WordPress + WooCommerce</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Démo ultra-rapide en 24h</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Process simple, sans engagement, sans bla-bla</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Accompagnement après mise en ligne (optionnel)</span>
          </li>
        </ul>
      </div>

      {/* Technologies */}
      <SocialProof />
    </section>
  );
}

function SocialProof() {
  // Badges de technologies - Focus WordPress/WooCommerce
  const partnerBadges = [
    { name: "WordPress", color: "text-[#21759B]" },
    { name: "WooCommerce", color: "text-[#96588A]" },
    { name: "Elementor", color: "text-[#92003B]" }
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

