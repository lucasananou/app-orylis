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
        answer: "Un site vitrine Orylis est à 1 490€ HT tout compris. La démo est incluse et tu décides ensuite."
      },
      {
        id: "demo_free",
        question: "La démo est-elle vraiment gratuite ?",
        answer: "Oui, 100% gratuite et sans engagement. Tu remplis le formulaire, tu reçois un site personnalisé en 24h, et tu décides si tu veux continuer ou non."
      },
      {
        id: "installments",
        question: "Puis-je payer en plusieurs fois ?",
        answer: "Oui. Paiement possible en 1x, 3x ou 4x selon ton budget."
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
        answer: "Après validation de la démo et acompte payé, un site vitrine est livré en 7 jours. Pour l’e‑commerce, prévoir 8 à 15 jours selon le catalogue."
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
        answer: "Oui. Tu peux modifier textes, images, sections, couleurs et pages. Si tu préfères, je m’en charge gratuitement pendant les 90 premiers jours après livraison."
      },
      {
        id: "what_demo_includes",
        question: "Que comprend exactement la démo ?",
        answer: "Une structure complète adaptée à ton activité : page d’accueil, identité visuelle cohérente, header/footer, sections services/tarifs/contact, version mobile optimisée, design pro (WordPress + Elementor Pro)."
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
        answer: "Oui. Boutiques complètes avec WooCommerce, Stripe/Paypal, pages produit optimisées, gestion du catalogue et tunnel simplifié. Prix fixe 2 290€ HT."
      },
      {
        id: "all_included",
        question: "Est-ce que tout est inclus ou il y a des coûts cachés ?",
        answer: "Tout est inclus : nom de domaine, hébergement optimisé, certificat SSL, plugins premium, optimisation mobile. Tu n’as rien à acheter."
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
        answer: "Deux options : 1) Tu gères toi‑même (gratuit) avec accès et mini‑formation. 2) Je m’en occupe (29€/mois) : mises à jour, sécurité, sauvegardes automatiques, modifications illimitées, support prioritaire. 80% des clients choisissent l’abonnement."
      },
      {
        id: "aftercare",
        question: "Suis-je accompagné après la livraison ?",
        answer: "Oui, avec un espace client, un système de tickets et un dashboard de suivi. Tu n’es jamais laissé seul."
      }
    ]
  },
  {
    id: "process",
    label: "Processus",
    questions: [
      {
        id: "after_demo_process",
        question: "Comment se passe la suite si j’aime la démo ?",
        answer: "Tu valides la proposition, payes l’acompte (Stripe sécurisé), ton site passe en priorité. Livraison 7 jours, corrections et ajustements illimités."
      },
      {
        id: "contact_options",
        question: "Comment vous contacter si j’ai une question ?",
        answer: "Depuis le chat, via “Parler avec Lucas sur WhatsApp”, ou en réservant un appel."
      }
    ]
  }
];


