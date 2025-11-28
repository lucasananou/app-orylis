"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail } from "lucide-react";

// Types de templates disponibles
type TemplateCategory = "onboarding" | "quotes" | "notifications" | "admin";

interface EmailPreview {
    id: string;
    category: TemplateCategory;
    title: string;
    description: string;
    subject: string;
    html: string;
}

// Données mockées pour les previews
const mockData = {
    userName: "Jean Dupont",
    projectName: "Site Vitrine Immobilier",
    userEmail: "jean.dupont@example.com",
    userPassword: "password123",
    loginUrl: "https://app.orylis.fr/login",
    onboardingUrl: "https://app.orylis.fr/onboarding",
    demoUrl: "https://app.orylis.fr/demo",
    dashboardUrl: "https://app.orylis.fr/",
    quoteId: "DEV-2024-001",
    quoteUrl: "https://app.orylis.fr/quote/DEV-2024-001",
    signedPdfUrl: "https://app.orylis.fr/files/devis-signe.pdf",
    ticketTitle: "Changement de couleur header",
    ticketUrl: "https://app.orylis.fr/tickets/123",
    fileName: "logo.png",
    filesUrl: "https://app.orylis.fr/files",
    authorName: "Jean Dupont",
    status: "en cours",
    updateMessage: "La page contact a été intégrée."
};

// Fonction helper pour générer le HTML (copie simplifiée de getEmailTemplate)
// Fonction helper pour générer le HTML (copie simplifiée de getEmailTemplate)
function getTemplateHtml(content: string, ctaText?: string, ctaUrl?: string) {
    const ctaButton = ctaUrl && ctaText ? `
    <!-- CTA -->
    <p style="margin:24px 0 16px 0;">
      <a href="#" style="display:inline-block;background:#1b5bff;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:bold;font-size:14px;border-radius:6px;">${ctaText}</a>
    </p>
    <!-- Fallback link -->
    <p style="margin:0 0 18px 0;font-size:12px;line-height:18px;color:#6b7280;">
      Si le bouton ne fonctionne pas, copiez/collez ce lien : <span style="color:#2563eb;text-decoration:underline;">https://...</span>
    </p>` : "";

    return `
    <div style="font-family:Arial,sans-serif;background:#ffffff;padding:20px;border:1px solid #eaecef;max-width:600px;margin:0 auto;">
      ${content}
      ${ctaButton}
      
      <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
        Je vous laisse commencer tranquillement. En cas de question, écrivez-moi depuis l’espace ou répondez à cet e-mail.
      </p>

      <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#111827;">
        À très vite,<br>
        <strong>Lucas – Orylis</strong>
      </p>

      <p style="margin:20px 0 0 0;font-size:11px;color:#9aa3af;border-top:1px solid #eaecef;padding-top:10px;">
        Cet e-mail fait suite à votre demande et à la création de votre espace client Orylis.
      </p>
    </div>
  `;
}

// Définition des templates
const templates: EmailPreview[] = [
    // ONBOARDING
    {
        id: "welcome_client",
        category: "onboarding",
        title: "Bienvenue Client",
        description: "Envoyé lors de la création manuelle d'un compte client.",
        subject: "Votre accès à Orylis Hub",
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName} 👋</h2>
      <p>Bienvenue sur votre espace client Orylis !</p>
      <p>Votre projet <strong>${mockData.projectName}</strong> a été créé avec succès.</p>
      <p>Votre compte a été créé par l'équipe Orylis. Voici vos identifiants de connexion :</p>
      <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: #0F172A;"><strong>Email :</strong> ${mockData.userEmail}</p>
        <p style="margin: 8px 0 0 0; color: #0F172A;"><strong>Mot de passe :</strong> ${mockData.userPassword}</p>
      </div>
      <p>Connectez-vous dès maintenant pour commencer !</p>
    `, "Accéder à mon espace")
    },
    {
        id: "welcome_prospect",
        category: "onboarding",
        title: "Bienvenue Prospect",
        description: "Envoyé lors de l'inscription d'un prospect (Setter).",
        subject: "Bienvenue sur Orylis - Commencez votre onboarding",
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName} 👋</h2>
      <p>Bienvenue dans votre espace Orylis ! On va vous guider étape par étape.</p>
      <p>Votre projet <strong>${mockData.projectName}</strong> a été créé avec succès.</p>
      <p><strong>Prochaine étape :</strong> Remplissez votre formulaire d'onboarding pour que nous puissions créer votre démo personnalisée.</p>
    `, "Commencer l'onboarding")
    },
    {
        id: "reminder_24h",
        category: "onboarding",
        title: "Relance Onboarding (24h)",
        description: "Envoyé 24h après inscription si onboarding incomplet.",
        subject: "Vous êtes à 2 minutes de débloquer votre démo ✨",
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName},</h2>
      <p>Vous avez commencé l’onboarding pour votre projet <strong>${mockData.projectName}</strong>, mais il manque encore quelques informations.</p>
      <p>👉 Dès que vous terminez, je vous envoie la démo personnalisée sous 24h.</p>
      <p>Ça prend 2–3 minutes maximum.</p>
    `, "Reprendre l’onboarding")
    },
    {
        id: "reminder_48h",
        category: "onboarding",
        title: "Relance Onboarding (48h)",
        description: "Envoyé 48h après inscription si onboarding incomplet.",
        subject: "On avance sur votre site ? 😊",
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName},</h2>
      <p>Je vois que l’onboarding du projet <strong>${mockData.projectName}</strong> n’est pas encore terminé.</p>
      <p>Tant qu’il n’est pas complété, je ne peux pas lancer votre démo personnalisée.</p>
      <p>Bonne nouvelle : il ne vous reste que quelques étapes.</p>
    `, "Continuer l’onboarding")
    },
    {
        id: "reminder_7d",
        category: "onboarding",
        title: "Relance Onboarding (J+7)",
        description: "Envoyé 7 jours après inscription si onboarding incomplet (une seule fois).",
        subject: "Votre projet est toujours d’actualité ?",
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName},</h2>
      <p>Cela fait maintenant 7 jours que l’onboarding du projet <strong>${mockData.projectName}</strong> n’a pas été finalisé.</p>
      <p>Je garde encore votre créneau de production ouvert, mais je ne pourrai pas le bloquer longtemps.</p>
    `, "Terminer l’onboarding")
    },

    // QUOTES
    {
        id: "quote_ready",
        category: "quotes",
        title: "Devis Prêt",
        description: "Envoyé quand un devis est généré.",
        subject: `Votre devis pour ${mockData.projectName} est prêt 📄`,
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName},</h2>
      <p>Bonne nouvelle : votre devis pour le projet <strong>${mockData.projectName}</strong> est maintenant disponible.</p>
      <p>Vous pouvez le consulter et le signer directement ici.</p>
      <p>Dès votre signature, je lance la préparation de votre site.</p>
    `, "Accéder au devis")
    },
    {
        id: "quote_reminder_3d",
        category: "quotes",
        title: "Relance Devis (J+3)",
        description: "Envoyé 3 jours après génération du devis si non signé.",
        subject: `Toujours partant pour votre site ${mockData.projectName} ?`,
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName},</h2>
      <p>Vous avez reçu votre devis pour <strong>${mockData.projectName}</strong> il y a quelques jours, mais il n’a pas encore été signé.</p>
      <p>Bonne nouvelle : il est toujours valable.</p>
    `, "Consulter & signer le devis")
    },
    {
        id: "quote_reminder_7d",
        category: "quotes",
        title: "Relance Devis (J+7)",
        description: "Envoyé 7 jours après génération du devis si non signé.",
        subject: "Je garde votre créneau encore 48h",
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${mockData.userName},</h2>
      <p>Votre devis pour le projet <strong>${mockData.projectName}</strong> n’a toujours pas été signé après plusieurs relances.</p>
      <p>Je préfère être transparent : Votre créneau de production est encore réservé 48h.</p>
    `, "Accéder au devis")
    },
    {
        id: "quote_signed",
        category: "quotes",
        title: "Devis Signé (Client)",
        description: "Confirmation envoyée au client après signature.",
        subject: `Devis signé : ${mockData.projectName}`,
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Devis signé avec succès ! 🎉</h2>
      <p>Bonjour ${mockData.userName},</p>
      <p>Merci d'avoir signé le devis pour votre projet <strong>${mockData.projectName}</strong>.</p>
      <p>Votre projet est maintenant officiellement lancé !</p>
    `, "Télécharger le devis signé")
    },

    // NOTIFICATIONS
    {
        id: "ticket_updated",
        category: "notifications",
        title: "Ticket Mis à jour",
        description: "Envoyé au client quand un ticket change de statut.",
        subject: `Ticket mis à jour : ${mockData.ticketTitle}`,
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Ticket mis à jour</h2>
      <p>Le ticket <strong>${mockData.ticketTitle}</strong> a été mis à jour.</p>
      <p>Nouveau statut : <strong>${mockData.status}</strong></p>
    `, "Voir le ticket")
    },
    {
        id: "project_updated",
        category: "notifications",
        title: "Projet Mis à jour",
        description: "Envoyé au client lors d'une mise à jour du projet.",
        subject: `Projet mis à jour : ${mockData.projectName}`,
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Projet mis à jour</h2>
      <p>Votre projet <strong>${mockData.projectName}</strong> a été mis à jour.</p>
      <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600;">${mockData.updateMessage}</p>
      </div>
    `, "Voir le projet")
    },

    // ADMIN
    {
        id: "admin_prospect",
        category: "admin",
        title: "Nouveau Prospect",
        description: "Notif admin : nouveau compte créé.",
        subject: `Nouveau prospect: ${mockData.userName}`,
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Nouveau compte prospect</h2>
      <p>Un nouveau compte vient d'être créé sur Orylis Hub.</p>
      <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Nom:</strong> ${mockData.userName}</p>
        <p><strong>Projet:</strong> ${mockData.projectName}</p>
      </div>
    `, "Ouvrir le dashboard")
    },
    {
        id: "admin_inactivity",
        category: "admin",
        title: "Alerte Inactivité",
        description: "Notif admin : prospect inactif depuis 7 jours.",
        subject: `Prospect inactif : ${mockData.userName} - ${mockData.projectName}`,
        html: getTemplateHtml(`
      <h2 style="color: #1a202c; margin-top: 0;">Prospect inactif : ${mockData.userName}</h2>
      <p>Le prospect est inactif depuis 7 jours.</p>
      <div style="background-color: #FEF2F2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #FECACA;">
        <p style="margin: 0; color: #991B1B;"><strong>Statut :</strong> Onboarding incomplet</p>
      </div>
      <p>Tu devrais probablement tenter un appel ou un SMS.</p>
    `, "Ouvrir le dashboard")
    }
];

export function EmailPreviewGallery() {
    const [selectedCategory, setSelectedCategory] = React.useState<TemplateCategory>("onboarding");

    const filteredTemplates = templates.filter((t) => t.category === selectedCategory);

    return (
        <div className="space-y-6">
            <Tabs value={selectedCategory} onValueChange={(v: string) => setSelectedCategory(v as TemplateCategory)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="onboarding">Onboarding & Relances</TabsTrigger>
                    <TabsTrigger value="quotes">Devis</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications Client</TabsTrigger>
                    <TabsTrigger value="admin">Notifications Admin</TabsTrigger>
                </TabsList>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="flex flex-col overflow-hidden">
                            <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-base">{template.title}</CardTitle>
                                </div>
                                <CardDescription>{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <div className="border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">Objet :</span> {template.subject}
                                </div>
                                <div
                                    className="p-4 text-sm"
                                    dangerouslySetInnerHTML={{ __html: template.html }}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </Tabs>
        </div>
    );
}
