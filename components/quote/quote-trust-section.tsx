"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Headphones, Users, CheckCircle2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

export function QuoteTrustSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 bg-white/50 hover:bg-white transition-colors">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Support 7j/7</p>
        <p className="text-xs text-slate-500 mt-1">Assistance prioritaire</p>
      </div>
      <div className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 bg-white/50 hover:bg-white transition-colors">
        <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center mb-3">
          <Headphones className="h-5 w-5 text-purple-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Expert dédié</p>
        <p className="text-xs text-slate-500 mt-1">Ligne directe</p>
      </div>
      <div className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 bg-white/50 hover:bg-white transition-colors">
        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Garantie</p>
        <p className="text-xs text-slate-500 mt-1">Satisfait ou refait</p>
      </div>
      <div className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 bg-white/50 hover:bg-white transition-colors">
        <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center mb-3">
          <Users className="h-5 w-5 text-amber-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900">+100 Clients</p>
        <p className="text-xs text-slate-500 mt-1">Nous font confiance</p>
      </div>
    </div>
  );
}

export function QuoteTimeline() {
  return (
    <Card className="border-slate-100 bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-8">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span>🚀</span> Et après la signature ?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-4">
          {/* Ligne de connexion (Desktop) */}
          <div className="hidden md:block absolute top-4 left-4 right-4 h-0.5 bg-slate-100 -z-10" />

          {/* Étape 1 */}
          <div className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1 group">
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-200 ring-4 ring-white z-10 relative transition-transform duration-500 group-hover:scale-110">1</div>
              <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20" />
            </div>
            <div className="transform transition-all duration-500 translate-y-0 opacity-100">
              <p className="font-semibold text-slate-900 text-sm">Préparation</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                <span className="text-blue-600 font-medium">Immédiat :</span> Vous ne perdez aucun temps, on lance tout.
              </p>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1 group delay-100">
            <div className="h-8 w-8 rounded-full bg-white border-2 border-blue-600 text-blue-600 flex items-center justify-center text-sm font-bold shadow-sm ring-4 ring-white transition-transform duration-500 group-hover:scale-110">2</div>
            <div className="transform transition-all duration-500 translate-y-0 opacity-100">
              <p className="font-semibold text-slate-900 text-sm">Planning (24h)</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                Vous recevez une roadmap limpide sous 24h.
              </p>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1 group delay-200">
            <div className="h-8 w-8 rounded-full bg-white border-2 border-slate-300 text-slate-500 flex items-center justify-center text-sm font-bold shadow-sm ring-4 ring-white transition-transform duration-500 group-hover:scale-110">3</div>
            <div className="transform transition-all duration-500 translate-y-0 opacity-100">
              <p className="font-semibold text-slate-900 text-sm">Espace Client</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                Suivez tout en temps réel, sans demandes répétitives.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuoteFAQ() {
  const faqItems = [
    {
      question: "Puis-je modifier le devis après signature ?",
      answer:
        "Oui, nous sommes flexibles. Si vous souhaitez ajuster certains éléments, contactez-nous via le chat ou par email. Nous adapterons le devis selon vos besoins."
    },
    {
      question: "Quand le projet commence-t-il après signature ?",
      answer:
        "Le projet démarre immédiatement après validation du devis. Vous recevrez un planning détaillé dans les 24h suivant la signature, avec les dates clés et les étapes de développement."
    },
    {
      question: "Comment se passe le paiement ?",
      answer:
        "Le paiement est sécurisé et peut être effectué par virement bancaire ou via notre système de facturation. Les modalités de paiement sont détaillées dans le devis."
    },
    {
      question: "Que se passe-t-il si je ne suis pas satisfait ?",
      answer:
        "Votre satisfaction est notre priorité. Nous travaillons en étroite collaboration avec vous tout au long du projet pour garantir un résultat qui correspond à vos attentes. En cas de besoin, nous adaptons le projet jusqu'à ce que vous soyez satisfait."
    }
  ];

  return (
    <Card className="border border-border/70 bg-white w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl break-words">Questions fréquentes</CardTitle>
        <CardDescription className="text-sm sm:text-base break-words">
          Tout ce que vous devez savoir sur la signature
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-sm sm:text-base">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
