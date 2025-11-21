"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StickyCTA() {
  const [isVisible, setIsVisible] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      // Afficher après 35px de scroll
      if (window.scrollY > 35) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Trouver le formulaire dans le DOM
    const form = document.querySelector('form[class*="space-y"]');
    if (form) {
      formRef.current = form as HTMLFormElement;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Vérifier la position initiale
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    // Scroll vers le formulaire
    const form = document.querySelector('form[class*="space-y"]');
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus sur le premier champ (email)
      const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 300);
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg lg:hidden">
      <div className="mx-auto w-full max-w-md px-4 py-3">
        <Button
          onClick={handleClick}
          size="lg"
          className="w-full bg-[#1b5bff] text-white transition-all duration-200 hover:bg-[#1553e6] hover:shadow-lg hover:shadow-[#1b5bff]/25"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Voir mon futur site gratuitement
        </Button>
      </div>
    </div>
  );
}

