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
    <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl break-words">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />
          Pourquoi nous faire confiance ?
        </CardTitle>
        <CardDescription className="text-sm sm:text-base break-words">
          Votre satisfaction est notre priorité
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Garanties et engagements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg bg-white/60 border border-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground break-words">Support 7j/7</p>
              <p className="text-xs text-muted-foreground break-words mt-0.5">
                Assistance disponible à tout moment
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg bg-white/60 border border-emerald-100">
            <Headphones className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground break-words">Communication directe</p>
              <p className="text-xs text-muted-foreground break-words mt-0.5">
                Échanges en temps réel avec l&apos;équipe
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg bg-white/60 border border-emerald-100">
            <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground break-words">Satisfaction garantie</p>
              <p className="text-xs text-muted-foreground break-words mt-0.5">
                Nous nous adaptons à vos besoins
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg bg-white/60 border border-emerald-100">
            <Users className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground break-words">Clients satisfaits</p>
              <p className="text-xs text-muted-foreground break-words mt-0.5">
                Des centaines de projets livrés
              </p>
            </div>
          </div>
        </div>

        {/* Preuve sociale */}
        <div className="pt-2 border-t border-emerald-200">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Sécurisé
            </Badge>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              <Users className="h-3 w-3 mr-1" />
              +100 clients
            </Badge>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              <Shield className="h-3 w-3 mr-1" />
              Confiance
            </Badge>
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

