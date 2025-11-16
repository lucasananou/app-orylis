export type FaqQuestion = { id: string; question: string; answer: string };
export type FaqCategory = { id: string; label: string; questions: FaqQuestion[] };

export const WHATSAPP_NUMBER = "33613554022"; // Remplace par ton numéro au format international sans '+'

export const faqCategories: FaqCategory[] = [
  {
    id: "pricing",
    label: "Prix & paiement",
    questions: [
      {
        id: "pricing_after_demo",
        question: "Combien coûte un site après la démo ?",
        answer:
          "Après la démo, le prix dépend de la complexité (pages, fonctionnalités, e‑commerce). Nos sites vitrines commencent généralement à partir de 1 500–3 500€ et évoluent selon les besoins. Un devis clair est fourni avant tout démarrage."
      },
      {
        id: "demo_free",
        question: "La démo est-elle vraiment gratuite ?",
        answer:
          "Oui, la démo est 100% gratuite et sans engagement. Elle sert à valider le style, la structure et les contenus avant de décider ensemble du projet final."
      }
    ]
  },
  {
    id: "timeline",
    label: "Délais",
    questions: [
      {
        id: "final_timing",
        question: "Combien de temps pour avoir mon site final ?",
        answer:
          "Pour un site vitrine standard, compte 2 à 4 semaines après validation. Pour des besoins avancés (e‑commerce, intégrations), prévoir 4 à 6 semaines en moyenne."
      }
    ]
  },
  {
    id: "demo_flow",
    label: "Fonctionnement de la démo",
    questions: [
      {
        id: "can_edit_demo",
        question: "Est-ce que je peux modifier mon site moi-même ?",
        answer:
          "Oui. Nous configurons un éditeur simple (ex. blocs visuels) afin que tu puisses changer textes, images et sections sans coder. Nous fournissons un guide rapide."
      }
    ]
  },
  {
    id: "tech",
    label: "Technique (WordPress, e‑commerce…)",
    questions: [
      {
        id: "ecommerce",
        question: "Est-ce que vous faites aussi l’e-commerce ?",
        answer:
          "Oui. Nous proposons des sites e‑commerce adaptés (ex. WooCommerce, Shopify) en fonction du catalogue, du paiement et de la logistique souhaités."
      }
    ]
  },
  {
    id: "maintenance",
    label: "Maintenance & support",
    questions: [
      {
        id: "maintenance_how",
        question: "Comment se passe la maintenance ?",
        answer:
          "Nous proposons une maintenance mensuelle (mises à jour, sécurité, sauvegardes) avec support prioritaire. Le forfait exact dépend de la solution choisie."
      }
    ]
  }
];


