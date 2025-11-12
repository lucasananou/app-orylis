/**
 * Service d'envoi d'emails via Resend
 * 
 * Ce service centralise tous les envois d'emails de l'application.
 * Les templates sont définis ici et peuvent être facilement modifiés.
 */

import { Resend } from "resend";
import { db } from "@/lib/db";
import { profiles, projects, emailTemplates } from "@/lib/schema";
import { eq } from "drizzle-orm";

export type EmailTemplateType =
  | "welcome"
  | "ticket_created"
  | "ticket_reply"
  | "ticket_updated"
  | "file_uploaded"
  | "onboarding_completed"
  | "project_updated";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const emailFrom = process.env.EMAIL_FROM ?? "no-reply@orylis.app";
const appUrl = process.env.NEXTAUTH_URL ?? "https://app.orylis.fr";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoie un email via Resend
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured, email not sent:", options.subject);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? options.html.replace(/<[^>]*>/g, "")
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Récupère les informations d'un utilisateur pour les emails
 */
async function getUserInfo(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: {
      fullName: true,
      id: true
    }
  });

  // Récupérer l'email depuis auth_users (la table user)
  const { authUsers } = await import("@/lib/schema");
  const authUser = await db.query.authUsers.findFirst({
    where: eq(authUsers.id, userId),
    columns: {
      email: true,
      name: true
    }
  });

  return {
    name: profile?.fullName ?? authUser?.name ?? null,
    email: authUser?.email ?? null
  };
}

/**
 * Récupère un template depuis la base de données ou utilise le fallback
 */
async function getTemplateFromDB(
  type: EmailTemplateType,
  fallbackSubject: string,
  fallbackHtml: string
): Promise<{ subject: string; html: string }> {
  try {
    const template = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.type, type),
      columns: {
        subject: true,
        htmlContent: true
      }
    });

    if (template) {
      return {
        subject: template.subject,
        html: template.htmlContent
      };
    }
  } catch (error) {
    console.warn(`[Email] Failed to load template ${type} from DB, using fallback:`, error);
  }

  return {
    subject: fallbackSubject,
    html: fallbackHtml
  };
}

/**
 * Remplace les variables dans un template HTML
 */
function replaceTemplateVariables(html: string, variables: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Template de base pour tous les emails
 */
function getEmailTemplate(content: string, ctaText?: string, ctaUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f7f9fb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 24px;
      font-weight: 600;
      color: #0D69FF;
      margin-bottom: 8px;
    }
    .content {
      color: #4a5568;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0D69FF;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      margin: 16px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #718096;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Orylis Hub</div>
    </div>
    <div class="content">
      ${content}
    </div>
    ${ctaUrl && ctaText ? `<div style="text-align: center;"><a href="${ctaUrl}" class="button">${ctaText}</a></div>` : ""}
    <div class="footer">
      <p>Cet email a été envoyé depuis votre espace client Orylis.</p>
      <p>Si vous avez des questions, contactez-nous à <a href="mailto:hello@orylis.fr">hello@orylis.fr</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email de bienvenue pour un nouveau client
 */
export async function sendWelcomeEmail(userId: string, projectName?: string) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bienvenue";
  
  // Template par défaut
  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour {{userName}} 👋</h2>
    <p>Bienvenue sur votre espace client Orylis !</p>
    {{projectInfo}}
    <p>Vous pouvez maintenant :</p>
    <ul>
      <li>Suivre l'avancement de votre projet en temps réel</li>
      <li>Transmettre vos contenus et fichiers</li>
      <li>Échanger avec l'équipe via le système de tickets</li>
      <li>Accéder à vos factures</li>
    </ul>
    <p>Connectez-vous dès maintenant pour commencer !</p>
  `;

  const projectInfo = projectName
    ? `<p>Votre projet <strong>${projectName}</strong> a été créé avec succès.</p>`
    : "";

  const defaultHtml = getEmailTemplate(
    defaultContent.replace("{{projectInfo}}", projectInfo),
    "Accéder à mon espace",
    `${appUrl}/login`
  );

  // Récupérer le template depuis la DB ou utiliser le fallback
  const template = await getTemplateFromDB(
    "welcome",
    "Bienvenue sur Orylis Hub",
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    projectName: projectName ?? "",
    loginUrl: `${appUrl}/login`
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName, projectName: projectName ?? "" }),
    html
  });
}

/**
 * Email de notification : nouveau ticket créé
 */
export async function sendTicketCreatedEmail(
  ticketId: string,
  ticketTitle: string,
  projectName: string,
  authorName: string,
  recipientUserId: string
) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Nouveau ticket créé</h2>
    <p><strong>${authorName}</strong> a créé un nouveau ticket pour le projet <strong>${projectName}</strong>.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 600;">${ticketTitle}</p>
    </div>
    <p>Connectez-vous pour voir les détails et y répondre.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Nouveau ticket : ${ticketTitle}`,
    html: getEmailTemplate(content, "Voir le ticket", `${appUrl}/tickets/${ticketId}`)
  });
}

/**
 * Email de notification : réponse sur un ticket
 */
export async function sendTicketReplyEmail(
  ticketId: string,
  ticketTitle: string,
  projectName: string,
  authorName: string,
  recipientUserId: string
) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Nouvelle réponse sur votre ticket</h2>
    <p><strong>${authorName}</strong> a répondu sur le ticket <strong>${ticketTitle}</strong> (projet ${projectName}).</p>
    <p>Connectez-vous pour voir la réponse complète.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Réponse sur : ${ticketTitle}`,
    html: getEmailTemplate(content, "Voir la réponse", `${appUrl}/tickets/${ticketId}`)
  });
}

/**
 * Email de notification : ticket mis à jour
 */
export async function sendTicketUpdatedEmail(
  ticketId: string,
  ticketTitle: string,
  projectName: string,
  status: string,
  recipientUserId: string
) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const statusLabels: Record<string, string> = {
    open: "ouvert",
    in_progress: "en cours",
    done: "résolu"
  };

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Ticket mis à jour</h2>
    <p>Le ticket <strong>${ticketTitle}</strong> (projet ${projectName}) a été mis à jour.</p>
    <p>Nouveau statut : <strong>${statusLabels[status] ?? status}</strong></p>
    <p>Connectez-vous pour voir les détails.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Ticket mis à jour : ${ticketTitle}`,
    html: getEmailTemplate(content, "Voir le ticket", `${appUrl}/tickets/${ticketId}`)
  });
}

/**
 * Email de notification : fichier uploadé
 */
export async function sendFileUploadedEmail(
  fileName: string,
  projectName: string,
  uploaderName: string,
  recipientUserId: string
) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Nouveau fichier ajouté</h2>
    <p><strong>${uploaderName}</strong> a ajouté un nouveau fichier au projet <strong>${projectName}</strong>.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;">📄 ${fileName}</p>
    </div>
    <p>Connectez-vous pour télécharger le fichier.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Nouveau fichier : ${fileName}`,
    html: getEmailTemplate(content, "Voir les fichiers", `${appUrl}/files`)
  });
}

/**
 * Email de notification : onboarding complété
 */
export async function sendOnboardingCompletedEmail(
  projectId: string,
  projectName: string,
  recipientUserId: string
) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Onboarding complété ! 🎉</h2>
    <p>L'onboarding du projet <strong>${projectName}</strong> a été complété avec succès.</p>
    <p>L'équipe Orylis va maintenant commencer la phase de design. Vous serez informé des prochaines étapes.</p>
    <p>Merci pour votre confiance !</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Onboarding complété : ${projectName}`,
    html: getEmailTemplate(content, "Voir le projet", `${appUrl}/projects/${projectId}`)
  });
}

/**
 * Email de notification : projet mis à jour
 */
export async function sendProjectUpdatedEmail(
  projectId: string,
  projectName: string,
  updateMessage: string,
  recipientUserId: string
) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Projet mis à jour</h2>
    <p>Votre projet <strong>${projectName}</strong> a été mis à jour.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 600;">${updateMessage}</p>
    </div>
    <p>Connectez-vous pour voir les détails complets.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Projet mis à jour : ${projectName}`,
    html: getEmailTemplate(content, "Voir le projet", `${appUrl}/projects/${projectId}`)
  });
}

