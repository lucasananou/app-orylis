/**
 * Service d'envoi d'emails via Resend
 * 
 * Ce service centralise tous les envois d'emails de l'application.
 * Les templates sont définis ici et peuvent être facilement modifiés.
 */

import { Resend } from "resend";
import { db } from "@/lib/db";
import { profiles, projects, emailTemplates, authUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export type EmailTemplateType =
  | "welcome"
  | "project_created"
  | "prospect_promoted"
  | "ticket_created"
  | "ticket_reply"
  | "ticket_updated"
  | "file_uploaded"
  | "onboarding_completed"
  | "project_updated"
  | "prospect_welcome"
  | "prospect_onboarding_completed"
  | "prospect_demo_ready"
  | "quote_signed"
  | "quote_signed_admin";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const emailFromAddress = process.env.EMAIL_FROM ?? "contact@orylis.fr";
const emailFrom = `Orylis.fr <${emailFromAddress}>`;
const appUrl = process.env.NEXTAUTH_URL ?? "https://app.orylis.fr";
const ADMIN_EMAIL = "orylisfrance@gmail.com";

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

  const maxAttempts = 3;
  const delaysMs = [300, 1000, 2500];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Email] Failed to send email (attempt ${attempt}/${maxAttempts}):`, message);
      if (attempt === maxAttempts) {
        return { success: false, error: message };
      }
      const delay = delaysMs[attempt - 1] ?? 2000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return { success: false, error: "Unknown error" };
}

/**
 * Récupère les informations d'un utilisateur pour les emails (optimisé avec une seule requête)
 */
async function getUserInfo(userId: string) {
  // Paralléliser les deux requêtes
  const [profile, authUser] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: {
        fullName: true,
        id: true
      }
    }),
    db.query.authUsers.findFirst({
      where: eq(authUsers.id, userId),
      columns: {
        email: true,
        name: true
      }
    })
  ]);

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
      where: eq(emailTemplates.type, type as any),
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
 * Template de base pour tous les emails (design moderne compatible email)
 */
function getEmailTemplate(content: string, ctaText?: string, ctaUrl?: string, footerText?: string): string {
  const ctaButton = ctaUrl && ctaText ? `
                <p style="margin:0 0 16px 0;">
                  <a href="${ctaUrl}" 
                     style="display:inline-block;background:#1b5bff;color:#ffffff;text-decoration:none;
                            padding:12px 18px;font-weight:bold;font-size:14px;border-radius:6px;">
                    ${ctaText}
                  </a>
                </p>
                <p style="margin:0 0 18px 0;font-size:12px;line-height:18px;color:#6b7280;">
                  Si le bouton ne fonctionne pas, copiez/collez ce lien dans votre navigateur&nbsp;:<br>
                  <a href="${ctaUrl}" style="color:#2563eb;text-decoration:underline;">${ctaUrl}</a>
                </p>
  ` : "";

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f5f7fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #eaecef;">
            <tr>
              <td style="padding:24px 20px;font-family:Arial,Helvetica,sans-serif;">
                ${content}
                ${ctaButton}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #eaecef;">
                <p style="margin:0;font-size:11px;line-height:16px;color:#9aa3af;">
                  ${footerText ?? "Cet e-mail fait suite à votre demande et à la création de votre espace client Orylis."}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

/**
 * Email de bienvenue pour un nouveau client
 */
export async function sendWelcomeEmail(
  userId: string,
  projectName?: string,
  credentials?: { email: string; password: string }
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bienvenue";
  
  // Template par défaut qui gère les deux cas
  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour {{userName}} 👋</h2>
    <p>Bienvenue sur votre espace client Orylis !</p>
    {{projectInfo}}
    {{credentialsSection}}
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

  const credentialsSection = credentials
    ? `<p>Votre compte a été créé par l'équipe Orylis. Voici vos identifiants de connexion :</p>
       <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 16px 0;">
         <p style="margin: 0; color: #0F172A;"><strong>Email :</strong> {{userEmail}}</p>
         <p style="margin: 8px 0 0 0; color: #0F172A;"><strong>Mot de passe :</strong> {{userPassword}}</p>
       </div>
       <p style="color: #64748B; font-size: 13px;">Pour des raisons de sécurité, pensez à modifier votre mot de passe après la première connexion.</p>`
    : "";

  const defaultHtml = getEmailTemplate(
    defaultContent
      .replace("{{projectInfo}}", projectInfo)
      .replace("{{credentialsSection}}", credentialsSection),
    "Accéder à mon espace",
    `${appUrl}/login`
  );

  // Récupérer le template depuis la DB ou utiliser le fallback
  const template = await getTemplateFromDB(
    "welcome",
    credentials ? "Votre accès à Orylis Hub" : "Bienvenue sur Orylis Hub",
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    projectName: projectName ?? "",
    userEmail: credentials?.email ?? "",
    userPassword: credentials?.password ?? "",
    MotDePasse: credentials?.password ?? "", // alias FR pour les templates
    loginUrl: `${appUrl}/login`
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName, projectName: projectName ?? "" }),
    html
  });
}

/**
 * Notification admin : nouveau compte prospect créé
 */
export async function sendProspectSignupEmailToAdmin(
  userId: string,
  projectName: string
) {
  // Récupérer infos utilisateur (email + nom si disponible)
  const user = await getUserInfo(userId);

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Nouveau compte prospect</h2>
    <p>Un nouveau compte vient d'être créé sur Orylis Hub.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Nom:</strong> ${user.name ?? "—"}</p>
      <p style="margin: 6px 0 0 0;"><strong>Email:</strong> ${user.email ?? "—"}</p>
      <p style="margin: 6px 0 0 0;"><strong>Projet:</strong> ${projectName}</p>
    </div>
    <p>Vous pouvez le retrouver dans le back-office.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nouveau prospect: ${user.name ?? user.email ?? "compte créé"}`,
    html: getEmailTemplate(content, "Ouvrir le dashboard", `${appUrl}/admin`)
  });
}

/**
 * Email de bienvenue avec identifiants (création de compte client)
 * @deprecated Utilisez sendWelcomeEmail avec le paramètre credentials à la place
 */
export async function sendWelcomeEmailWithCredentials(
  email: string,
  password: string,
  fullName?: string | null
): Promise<{ success: boolean; error?: string }> {
  // Trouver l'utilisateur par email
  const user = await db.query.authUsers.findFirst({
    where: (users, { eq }) => eq(users.email, email),
    columns: { id: true }
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  return sendWelcomeEmail(user.id, undefined, { email, password });
}

/**
 * Email de notification : nouveau ticket créé (envoyé à l'admin)
 */
export async function sendTicketCreatedEmailToAdmin(
  ticketId: string,
  ticketTitle: string,
  projectName: string,
  authorName: string
) {
  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Nouveau ticket créé</h2>
    <p><strong>${authorName}</strong> a créé un nouveau ticket pour le projet <strong>${projectName}</strong>.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; font-weight: 600;">${ticketTitle}</p>
    </div>
    <p>Connectez-vous pour voir les détails et y répondre.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nouveau ticket : ${ticketTitle}`,
    html: getEmailTemplate(content, "Voir le ticket", `${appUrl}/tickets/${ticketId}`)
  });
}

/**
 * Email de notification : nouveau ticket créé (version avec userId pour compatibilité)
 * @deprecated Utilisez sendTicketCreatedEmailToAdmin à la place
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
 * Email de notification : fichier uploadé (envoyé à l'admin)
 */
export async function sendFileUploadedEmailToAdmin(
  fileName: string,
  projectName: string,
  uploaderName: string
) {
  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Nouveau fichier ajouté</h2>
    <p><strong>${uploaderName}</strong> a ajouté un nouveau fichier au projet <strong>${projectName}</strong>.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;">📄 ${fileName}</p>
    </div>
    <p>Connectez-vous pour télécharger le fichier.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nouveau fichier : ${fileName}`,
    html: getEmailTemplate(content, "Voir les fichiers", `${appUrl}/files`)
  });
}

/**
 * Email de notification : fichier uploadé (version avec userId pour compatibilité)
 * @deprecated Utilisez sendFileUploadedEmailToAdmin à la place
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
 * Email de notification : onboarding complété (envoyé à l'admin)
 */
export async function sendOnboardingCompletedEmailToAdmin(
  projectId: string,
  projectName: string
) {
  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Onboarding complété ! 🎉</h2>
    <p>L'onboarding du projet <strong>${projectName}</strong> a été complété avec succès.</p>
    <p>Vous pouvez maintenant commencer la phase de design.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Onboarding complété : ${projectName}`,
    html: getEmailTemplate(content, "Voir le projet", `${appUrl}/projects/${projectId}`)
  });
}

/**
 * Email 1 : Bienvenue après création de compte (prospect)
 */
export async function sendProspectWelcomeEmail(userId: string, projectName: string) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bienvenue";

  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName} 👋</h2>
    <p>Bienvenue dans votre espace Orylis ! On va vous guider étape par étape.</p>
    <p>Votre projet <strong>${projectName}</strong> a été créé avec succès.</p>
    <p><strong>Prochaine étape :</strong> Remplissez votre formulaire d'onboarding pour que nous puissions créer votre démo personnalisée.</p>
    <p>L'onboarding ne prend que quelques minutes et nous permettra de mieux comprendre vos besoins.</p>
  `;

  const defaultHtml = getEmailTemplate(
    defaultContent,
    "Commencer l'onboarding",
    `${appUrl}/onboarding`
  );

  const template = await getTemplateFromDB(
    "prospect_welcome",
    "Bienvenue sur Orylis - Commencez votre onboarding",
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    projectName,
    onboardingUrl: `${appUrl}/onboarding`
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName, projectName }),
    html
  });
}

/**
 * Envoie un email "Démo prête" avec un contenu HTML fixe, sans passer par les templates DB
 */
export async function sendProspectDemoReadyEmailStatic(userId: string) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const subject = "Votre démo personnalisée est prête 🎉";

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f5f7fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #eaecef;">
            <tr>
              <td style="padding:24px 20px;font-family:Arial,Helvetica,sans-serif;">
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:28px;color:#111827;">Votre démo personnalisée est prête 🎉</h1>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  Bonne nouvelle : votre démo est prête !<br />
                  Vous pouvez la consulter dès maintenant depuis votre espace Orylis :
                </p>
                <p style="margin:0 0 16px 0;">
                  <a href="${appUrl}/login"
                     style="display:inline-block;background:#1b5bff;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:bold;font-size:14px;border-radius:6px;">
                    Voir ma démo maintenant !
                  </a>
                </p>
                <p style="margin:0 0 18px 0;font-size:12px;line-height:18px;color:#6b7280;">
                  Si le bouton ne fonctionne pas, copiez/collez ce lien dans votre navigateur&nbsp;:<br />
                  <a href="${appUrl}/login" style="color:#2563eb;text-decoration:underline;">${appUrl}/login</a>
                </p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">Si vous avez perdu votre mot de passe, veuillez retrouver le mail "Bienvenue dans votre espace Orylis 👋"</p>
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">J’ai construit un rendu adapté à votre activité, propre, moderne et pensé pour convertir vos visiteurs.</p>
                <br />
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;"><strong>Et maintenant ?</strong></p>
                <br />
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  Si la démo vous plaît, il suffit de me le confirmer et je me charge :
                </p>
                <ul style="margin:0 0 8px 16px;font-size:14px;line-height:22px;color:#111827;">
                  <li>d’adapter les pages</li>
                  <li>d’optimiser le contenu</li>
                  <li>de finaliser votre site</li>
                  <li>et de le mettre en ligne rapidement</li>
                </ul>
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  Besoin de modifications ou d’ajustements ?<br />
                  Dites-le-moi directement depuis votre espace ou en répondant à cet email.
                </p>
                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#111827;">
                  Hâte d’avoir votre retour,<br />
                  <strong>Lucas – Orylis</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #eaecef;">
                <p style="margin:0;font-size:11px;line-height:16px;color:#9aa3af;">
                  Cet e-mail fait suite à votre demande de démo et à la création de votre espace client.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendEmail({
    to: user.email,
    subject,
    html,
  });
}

/**
 * Variante: envoie le même email statique directement à une adresse
 * (utile pour éviter un aller-retour DB quand on a déjà l'email).
 */
export async function sendProspectDemoReadyEmailStaticTo(email: string) {
  if (!email) {
    return { success: false, error: "Recipient email missing" };
  }
  const subject = "Votre démo personnalisée est prête 🎉";
  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f5f7fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #eaecef;">
            <tr>
              <td style="padding:24px 20px;font-family:Arial,Helvetica,sans-serif;">
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:28px;color:#111827;">Votre démo personnalisée est prête 🎉</h1>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  Bonne nouvelle : votre démo est prête !<br />
                  Vous pouvez la consulter dès maintenant depuis votre espace Orylis :
                </p>
                <p style="margin:0 0 16px 0;">
                  <a href="${appUrl}/login"
                     style="display:inline-block;background:#1b5bff;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:bold;font-size:14px;border-radius:6px;">
                    Voir ma démo maintenant !
                  </a>
                </p>
                <p style="margin:0 0 18px 0;font-size:12px;line-height:18px;color:#6b7280;">
                  Si le bouton ne fonctionne pas, copiez/collez ce lien dans votre navigateur&nbsp;:<br />
                  <a href="${appUrl}/login" style="color:#2563eb;text-decoration:underline;">${appUrl}/login</a>
                </p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">Si vous avez perdu votre mot de passe, veuillez retrouver le mail "Bienvenue dans votre espace Orylis 👋"</p>
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">J’ai construit un rendu adapté à votre activité, propre, moderne et pensé pour convertir vos visiteurs.</p>
                <br />
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;"><strong>Et maintenant ?</strong></p>
                <br />
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  Si la démo vous plaît, il suffit de me le confirmer et je me charge :
                </p>
                <ul style="margin:0 0 8px 16px;font-size:14px;line-height:22px;color:#111827;">
                  <li>d’adapter les pages</li>
                  <li>d’optimiser le contenu</li>
                  <li>de finaliser votre site</li>
                  <li>et de le mettre en ligne rapidement</li>
                </ul>
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  Besoin de modifications ou d’ajustements ?<br />
                  Dites-le-moi directement depuis votre espace ou en répondant à cet email.
                </p>
                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#111827;">
                  Hâte d’avoir votre retour,<br />
                  <strong>Lucas – Orylis</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #eaecef;">
                <p style="margin:0;font-size:11px;line-height:16px;color:#9aa3af;">
                  Cet e-mail fait suite à votre demande de démo et à la création de votre espace client.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendEmail({ to: email, subject, html });
}
/**
 * Email 2 : Après onboarding complété (prospect)
 */
export async function sendProspectOnboardingCompletedEmail(
  userId: string,
  projectName: string
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Félicitations ${userName} ! 🎉</h2>
    <p>Votre onboarding est complété avec succès !</p>
    <p><strong>Votre démo est en préparation</strong> – Voici ce qui va se passer :</p>
    <ul>
      <li>Notre équipe analyse vos réponses et vos préférences</li>
      <li>Nous créons un site de démonstration personnalisé basé sur vos informations</li>
      <li>Vous recevrez une notification dès que votre démo sera prête</li>
    </ul>
    <p>En attendant, vous pouvez suivre l'avancement directement depuis votre espace client.</p>
    <p>Merci pour votre confiance !</p>
  `;

  const defaultHtml = getEmailTemplate(
    defaultContent,
    "Voir mon espace",
    `${appUrl}/`
  );

  const template = await getTemplateFromDB(
    "prospect_onboarding_completed",
    `Votre démo est en préparation - ${projectName}`,
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    projectName,
    dashboardUrl: `${appUrl}/`
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName, projectName }),
    html
  });
}

/**
 * Email 3 : Démo prête (prospect)
 */
export async function sendProspectDemoReadyEmail(
  userId: string,
  projectName: string,
  demoUrl: string
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Votre démo personnalisée est prête ! 🎉</h2>
    <p>Bonjour ${userName},</p>
    <p>Excellente nouvelle : votre site de démonstration pour le projet <strong>${projectName}</strong> est maintenant disponible !</p>
    <p>Nous avons créé une démo personnalisée basée sur toutes les informations que vous nous avez fournies lors de l'onboarding.</p>
    <p><strong>Prochaines étapes :</strong></p>
    <ul>
      <li>Consultez votre démo et voyez votre site prendre vie</li>
      <li>Validez votre site pour passer à la suite et bénéficier d'une mise en ligne prioritaire</li>
      <li>Ou prenez rendez-vous avec Lucas pour discuter de votre projet</li>
    </ul>
    <p>Nous sommes impatients de recevoir votre retour !</p>
  `;

  const defaultHtml = getEmailTemplate(defaultContent, "Voir ma démo", demoUrl || `${appUrl}/demo`);

  const template = await getTemplateFromDB(
    "prospect_demo_ready",
    `Votre démo ${projectName} est prête !`,
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    projectName,
    demoUrl: demoUrl || `${appUrl}/demo`
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName, projectName }),
    html
  });
}

/**
 * Email de notification : onboarding complété (version avec userId pour compatibilité)
 * @deprecated Utilisez sendOnboardingCompletedEmailToAdmin à la place
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
 * Email de notification : projet créé
 */
export async function sendProjectCreatedEmail(
  projectId: string,
  projectName: string,
  recipientUserId: string
) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  // Template par défaut
  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour {{userName}} 👋</h2>
    <p>Votre projet <strong>{{projectName}}</strong> a été créé avec succès !</p>
    <p>Pour démarrer, nous avons besoin que vous remplissiez votre onboarding. Cela nous permettra de mieux comprendre vos besoins et vos objectifs.</p>
    <p>L'onboarding ne prend que quelques minutes et nous aidera à créer un site web qui correspond parfaitement à vos attentes.</p>
  `;

  const defaultHtml = getEmailTemplate(
    defaultContent,
    "Commencer l'onboarding",
    `${appUrl}/onboarding?projectId=${projectId}`
  );

  // Récupérer le template depuis la DB ou utiliser le fallback
  const template = await getTemplateFromDB(
    "project_created",
    `Votre projet ${projectName} a été créé`,
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    projectName,
    onboardingUrl: `${appUrl}/onboarding?projectId=${projectId}`
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName, projectName }),
    html
  });
}

/**
 * Email de notification : prospect promu en client
 */
export async function sendProspectPromotedEmail(recipientUserId: string) {
  const user = await getUserInfo(recipientUserId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  // Template par défaut
  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Félicitations {{userName}} ! 🎉</h2>
    <p>Votre accès à l'espace client Orylis a été activé.</p>
    <p>Vous pouvez maintenant accéder à toutes les fonctionnalités :</p>
    <ul>
      <li>📋 Créer et suivre vos tickets</li>
      <li>📁 Uploader et gérer vos fichiers</li>
      <li>💳 Accéder à vos factures</li>
      <li>💬 Demander des modifications et donner votre feedback</li>
    </ul>
    <p>Connectez-vous dès maintenant pour découvrir toutes les fonctionnalités disponibles.</p>
  `;

  const defaultHtml = getEmailTemplate(
    defaultContent,
    "Accéder à mon espace",
    `${appUrl}/`
  );

  // Récupérer le template depuis la DB ou utiliser le fallback
  const template = await getTemplateFromDB(
    "prospect_promoted",
    "Votre accès client a été activé",
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    loginUrl: `${appUrl}/`
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName }),
    html
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

/**
 * Email de confirmation : devis signé (envoyé au prospect)
 */
export async function sendQuoteSignedEmailToProspect(
  userId: string,
  projectName: string,
  quoteId: string,
  signedPdfUrl: string
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  const defaultContent = `
    <h2 style="color: #1a202c; margin-top: 0;">Devis signé avec succès ! 🎉</h2>
    <p>Bonjour ${userName},</p>
    <p>Merci d'avoir signé le devis pour votre projet <strong>${projectName}</strong>.</p>
    <p>Votre projet est maintenant officiellement lancé ! Nous allons commencer la préparation de votre site dès maintenant.</p>
    <p><strong>Prochaines étapes :</strong></p>
    <ul>
      <li>Vous recevrez une date estimée de livraison dans les 24h</li>
      <li>Vous pourrez suivre l'avancement depuis votre espace client</li>
      <li>Vous aurez accès au système de tickets pour communiquer avec l'équipe</li>
    </ul>
    <p>Vous pouvez télécharger votre devis signé ci-dessous.</p>
  `;

  const defaultHtml = getEmailTemplate(
    defaultContent,
    "Télécharger le devis signé",
    signedPdfUrl
  );

  const template = await getTemplateFromDB(
    "quote_signed",
    `Devis signé : ${projectName}`,
    defaultHtml
  );

  const html = replaceTemplateVariables(template.html, {
    userName,
    projectName,
    quoteId,
    signedPdfUrl
  });

  return sendEmail({
    to: user.email,
    subject: replaceTemplateVariables(template.subject, { userName, projectName }),
    html
  });
}

/**
 * Email de notification : devis signé (envoyé à l'admin)
 */
export async function sendQuoteSignedEmailToAdmin(
  quoteId: string,
  projectName: string,
  prospectName: string,
  prospectEmail: string,
  signedPdfUrl: string
) {
  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Nouveau devis signé ! 🎉</h2>
    <p>Un devis vient d'être signé par un prospect.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Prospect:</strong> ${prospectName}</p>
      <p style="margin: 6px 0 0 0;"><strong>Email:</strong> ${prospectEmail}</p>
      <p style="margin: 6px 0 0 0;"><strong>Projet:</strong> ${projectName}</p>
      <p style="margin: 6px 0 0 0;"><strong>ID du devis:</strong> ${quoteId}</p>
    </div>
    <p>Le projet peut maintenant être lancé en phase de développement.</p>
    <p>Vous pouvez télécharger le devis signé ci-dessous.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Devis signé : ${projectName} - ${prospectName}`,
    html: getEmailTemplate(content, "Télécharger le devis signé", signedPdfUrl)
  });
}

/**
 * Email de rappel : onboarding incomplet
 */
export async function sendOnboardingReminderEmail(
  userId: string,
  projectName: string,
  projectId: string,
  delay: "24h" | "48h"
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";
  const delayText = delay === "24h" ? "24 heures" : "48 heures";

  const content = `
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:28px;color:#111827;">
                  Rappel : Complétez votre onboarding
                </h1>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  Bonjour ${userName},<br><br>
                  Il y a ${delayText}, vous avez commencé l'onboarding pour votre projet <strong>${projectName}</strong>.<br>
                  Pour recevoir votre démo personnalisée rapidement, nous vous invitons à compléter les informations manquantes.
                </p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  <strong>Pourquoi compléter maintenant ?</strong>
                </p>
                <ul style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  <li>Vous recevrez votre démo personnalisée sous 24h</li>
                  <li>Vous pourrez générer votre devis dès que l'onboarding sera terminé</li>
                  <li>Votre projet pourra démarrer plus rapidement</li>
                </ul>
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  Cela ne prend que quelques minutes !
                </p>
                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#111827;">
                  À bientôt,<br>
                  <strong>Lucas – Orylis</strong>
                </p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Rappel : Complétez votre onboarding pour ${projectName}`,
    html: getEmailTemplate(
      content,
      "Continuer l'onboarding",
      `${appUrl}/onboarding`,
      "Cet e-mail fait suite à votre demande de démo et à la création de votre espace client."
    )
  });
}

/**
 * Email de notification : devis prêt à être signé
 */
export async function sendQuoteReadyEmail(
  userId: string,
  projectName: string,
  quoteId: string
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  const content = `
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:28px;color:#111827;">
                  Votre devis est prêt ! 🎉
                </h1>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  Bonjour ${userName},<br><br>
                  Votre devis personnalisé pour le projet <strong>${projectName}</strong> est maintenant disponible.<br>
                  Vous pouvez le consulter et le signer directement depuis votre espace client.
                </p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  <strong>Prochaines étapes après signature :</strong>
                </p>
                <ul style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  <li>Lancement immédiat de la préparation de votre site</li>
                  <li>Reception d'un planning détaillé dans les 24h</li>
                  <li>Accès au système de tickets pour communiquer avec l'équipe</li>
                </ul>
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  N'hésitez pas à nous contacter si vous avez des questions !
                </p>
                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#111827;">
                  À bientôt,<br>
                  <strong>Lucas – Orylis</strong>
                </p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Votre devis ${projectName} est prêt à être signé`,
    html: getEmailTemplate(
      content,
      "Voir mon devis",
      `${appUrl}/quote/${quoteId}`,
      "Cet e-mail fait suite à votre demande de démo et à la création de votre espace client."
    )
  });
}

/**
 * Email de rappel : devis non signé après 3 jours
 */
export async function sendQuoteReminderEmail(
  userId: string,
  projectName: string,
  quoteId: string
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  const content = `
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:28px;color:#111827;">
                  Rappel : Votre devis vous attend
                </h1>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  Bonjour ${userName},<br><br>
                  Il y a 3 jours, nous vous avons envoyé un devis personnalisé pour votre projet <strong>${projectName}</strong>.<br>
                  Ce devis est toujours valable et vous pouvez le signer à tout moment.
                </p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:22px;color:#111827;">
                  <strong>Des questions ?</strong>
                </p>
                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  N'hésitez pas à nous contacter si vous souhaitez discuter du devis ou apporter des modifications. Nous sommes là pour vous accompagner !<br>
                  Vous pouvez également prendre rendez-vous pour échanger directement avec nous.
                </p>
                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#111827;">
                  À bientôt,<br>
                  <strong>Lucas – Orylis</strong>
                </p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Rappel : Votre devis ${projectName} vous attend`,
    html: getEmailTemplate(
      content,
      "Voir mon devis",
      `${appUrl}/quote/${quoteId}`,
      "Cet e-mail fait suite à votre demande de démo et à la création de votre espace client."
    )
  });
}

