import { Resend } from "resend";
import { db } from "@/lib/db";
import { profiles, projects, authUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";

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
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
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
        text: options.text ?? options.html.replace(/<[^>]*>/g, ""),
        attachments: options.attachments
      });
      console.log(`[Email] Sent successfully to ${options.to} (Subject: ${options.subject})`);
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
 * Template de base pour tous les emails (design moderne compatible email)
 */
export function getEmailTemplate(content: string, ctaText?: string, ctaUrl?: string, footerText?: string, preheader?: string): string {
  const preheaderHtml = preheader ? `
    <!-- Preheader (court et discret) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${preheader}
    </div>
  ` : "";

  const ctaButton = ctaUrl && ctaText ? `
                <!-- CTA (simple, sans VML, pour rester minimal) -->
                <p style="margin:24px 0 16px 0;">
                  <a href="${ctaUrl}" 
                     style="display:inline-block;background:#1b5bff;color:#ffffff;text-decoration:none;
                            padding:12px 18px;font-weight:bold;font-size:14px;border-radius:6px;">
                    ${ctaText}
                  </a>
                </p>

                <!-- Lien texte fallback -->
                <p style="margin:0 0 18px 0;font-size:12px;line-height:18px;color:#6b7280;">
                  Si le bouton ne fonctionne pas, copiez/collez ce lien dans votre navigateur&nbsp;:<br>
                  <a href="${ctaUrl}" style="color:#2563eb;text-decoration:underline;">${ctaUrl}</a>
                </p>
  ` : "";

  const defaultFooter = "Cet e-mail fait suite à votre demande et à la création de votre espace client Orylis.";

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f5f7fb;">
    ${preheaderHtml}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #eaecef;">
            <tr>
              <td style="padding:24px 20px;font-family:Arial,Helvetica,sans-serif;">
                ${content}
                ${ctaButton}

                <p style="margin:0;font-size:14px;line-height:22px;color:#111827;">
                  Je vous laisse commencer tranquillement. En cas de question, écrivez-moi depuis l’espace ou répondez à cet e-mail.
                </p>

                <p style="margin:18px 0 0 0;font-size:14px;line-height:22px;color:#111827;">
                  À très vite,<br>
                  <strong>Lucas – Orylis</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #eaecef;">
                <p style="margin:0;font-size:11px;line-height:16px;color:#9aa3af;">
                  ${footerText ?? defaultFooter}
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
  credentials?: { email: string; password: string },
  userInfo?: { name: string | null; email: string | null }
) {
  const user = userInfo ?? await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bienvenue";

  const projectInfo = projectName
    ? `<p>Votre projet <strong>${projectName}</strong> a été créé avec succès.</p>`
    : "";

  const credentialsSection = credentials
    ? `<p>Votre compte a été créé par l'équipe Orylis. Voici vos identifiants de connexion :</p>
       <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 16px 0;">
         <p style="margin: 0; color: #0F172A;"><strong>Email :</strong> ${credentials.email}</p>
         <p style="margin: 8px 0 0 0; color: #0F172A;"><strong>Mot de passe :</strong> ${credentials.password}</p>
       </div>
       <p style="color: #64748B; font-size: 13px;">Pour des raisons de sécurité, pensez à modifier votre mot de passe après la première connexion.</p>`
    : "";

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName} 👋</h2>
    <p>Bienvenue sur votre espace client Orylis !</p>
    ${projectInfo}
    ${credentialsSection}
    <p>Vous pouvez maintenant :</p>
    <ul>
      <li>Suivre l'avancement de votre projet en temps réel</li>
      <li>Transmettre vos contenus et fichiers</li>
      <li>Échanger avec l'équipe via le système de tickets</li>
      <li>Accéder à vos factures</li>
    </ul>
    <p>Connectez-vous dès maintenant pour commencer !</p>
  `;

  const subject = "Bienvenue sur votre espace Orylis";

  console.log("[Email] Sending Welcome Email to:", user.email);
  console.log("[Email] Has credentials:", !!credentials);

  return sendEmail({
    to: user.email,
    subject,
    html: getEmailTemplate(content, "Accéder à mon espace", `${appUrl}/login`)
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

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName} 👋</h2>
    <p>Bienvenue dans votre espace Orylis ! On va vous guider étape par étape.</p>
    <p>Votre projet <strong>${projectName}</strong> a été créé avec succès.</p>
    <p><strong>Prochaine étape :</strong> Remplissez votre formulaire d'onboarding pour que nous puissions créer votre démo personnalisée.</p>
    <p>L'onboarding ne prend que quelques minutes et nous permettra de mieux comprendre vos besoins.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: "Bienvenue sur Orylis - Commencez votre onboarding",
    html: getEmailTemplate(content, "Commencer l'onboarding", `${appUrl}/onboarding`)
  });
}

/**
 * Envoie un email "Démo prête" avec un contenu HTML fixe, sans passer par les templates DB
 */

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

  const content = `
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

  return sendEmail({
    to: user.email,
    subject: `Votre démo est en préparation - ${projectName}`,
    html: getEmailTemplate(content, "Voir mon espace", `${appUrl}/`)
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

  const content = `
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

  return sendEmail({
    to: user.email,
    subject: `Votre démo ${projectName} est prête !`,
    html: getEmailTemplate(content, "Voir ma démo", demoUrl || `${appUrl}/demo`)
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

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName} 👋</h2>
    <p>Votre projet <strong>${projectName}</strong> a été créé avec succès !</p>
    <p>Pour démarrer, nous avons besoin que vous remplissiez votre onboarding. Cela nous permettra de mieux comprendre vos besoins et vos objectifs.</p>
    <p>L'onboarding ne prend que quelques minutes et nous aidera à créer un site web qui correspond parfaitement à vos attentes.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Votre projet ${projectName} a été créé`,
    html: getEmailTemplate(content, "Commencer l'onboarding", `${appUrl}/onboarding?projectId=${projectId}`)
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

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Félicitations ${userName} ! 🎉</h2>
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

  return sendEmail({
    to: user.email,
    subject: "Votre accès client a été activé",
    html: getEmailTemplate(content, "Accéder à mon espace", `${appUrl}/`)
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

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Devis signé avec succès ! 🎉</h2>
    <p>Bonjour ${userName},</p>
    <p>Merci d'avoir signé le devis pour votre projet <strong>${projectName}</strong>.</p>
    <p><strong>Prochaine étape importante : Le règlement de l'acompte.</strong></p>
    <p>Pour valider définitivement le lancement du projet, merci de procéder au règlement de l'acompte de démarrage (500€).</p>
    <p>Si vous n'avez pas été redirigé automatiquement vers la page de paiement, vous pouvez y accéder en cliquant sur le lien ci-dessous (bouton "Payer l'acompte").</p>
    <p>Une fois l'acompte réglé, vous aurez accès à votre espace client pour commencer l'onboarding.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Devis signé : ${projectName} - Acompte à régler`,
    html: getEmailTemplate(content, "Accéder au paiement", `${appUrl}/quotes/${quoteId}/sign`)
  });
}

/**
 * Email de confirmation : acompte reçu (envoyé au nouveau client)
 */
export async function sendDepositReceivedEmail(userId: string, projectName: string) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Acompte reçu - Bienvenue ! 🚀</h2>
    <p>Bonjour ${userName},</p>
    <p>Nous avons bien reçu votre acompte pour le projet <strong>${projectName}</strong>.</p>
    <p><strong>Votre statut est maintenant officiellement "Client" !</strong></p>
    <p>Vous avez désormais accès à l'intégralité de votre espace client.</p>
    <p><strong>Prochaine étape :</strong> Merci de compléter votre fiche d'onboarding (informations techniques, contenus, préférences) pour que nous puissions démarrer.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Bienvenue chez Orylis ! Acompte reçu pour ${projectName}`,
    html: getEmailTemplate(content, "Commencer l'onboarding", `${appUrl}/onboarding`)
  });
}

/**
 * Email de notification : acompte reçu (envoyé à l'admin)
 */
export async function sendDepositReceivedEmailToAdmin(
  userId: string,
  projectName: string,
  amount: number
) {
  const user = await getUserInfo(userId);
  const userName = user.name ?? "Client inconnu";
  const userEmail = user.email ?? "Email inconnu";

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">💰 Acompte reçu !</h2>
    <p>Un acompte de <strong>${amount}€</strong> a été réglé pour le projet <strong>${projectName}</strong>.</p>
    <div style="background-color: #f7f9fb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Client:</strong> ${userName}</p>
      <p style="margin: 6px 0 0 0;"><strong>Email:</strong> ${userEmail}</p>
      <p style="margin: 6px 0 0 0;"><strong>Projet:</strong> ${projectName}</p>
    </div>
    <p>Le client a été automatiquement promu au statut "Client" et invité à compléter son onboarding.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `💰 Acompte reçu : ${projectName} (${amount}€)`,
    html: getEmailTemplate(content, "Voir le client", `${appUrl}/admin/clients`)
  });
}

/**
 * Envoie le même email statique "Démo prête" directement à une adresse
 * (utile pour éviter un aller-retour DB quand on a déjà l'email).
 */
export async function sendProspectDemoReadyEmailStaticTo(email: string) {
  if (!email) {
    return { success: false, error: "Recipient email missing" };
  }

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Votre démo personnalisée est prête ! 🎉</h2>
    <p>Bonne nouvelle : votre site de démonstration est maintenant disponible !</p>
    <p>Nous avons créé une démo personnalisée basée sur toutes les informations que vous nous avez fournies.</p>
    <p><strong>Prochaines étapes :</strong></p>
    <ul>
      <li>Consultez votre démo et voyez votre site prendre vie</li>
      <li>Validez votre site pour passer à la suite</li>
      <li>Ou prenez rendez-vous avec Lucas pour discuter de votre projet</li>
    </ul>
  `;

  return sendEmail({
    to: email,
    subject: "Votre démo personnalisée est prête 🎉",
    html: getEmailTemplate(content, "Voir ma démo", `${appUrl}/demo`)
  });
}

/**
 * Email de notification : devis signé (envoyé à l'admin)
 */
export async function sendQuoteSignedEmailToAdmin(
  quoteId: string,
  projectName: string,
  amount: number,
  signerName: string
) {
  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Devis signé ! ✍️</h2>
    <p><strong>${signerName}</strong> a signé le devis pour le projet <strong>${projectName}</strong>.</p>
    <p>Montant de l'acompte attendu : <strong>${amount}€</strong></p>
    <p>Connectez-vous pour voir le devis signé.</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Devis signé : ${projectName}`,
    html: getEmailTemplate(content, "Voir le devis", `${appUrl}/quotes/${quoteId}`)
  });
}

/**
 * Email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Réinitialisation de mot de passe</h2>
    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
    <p>Cliquez sur le lien ci-dessous pour en définir un nouveau :</p>
    <p>Ce lien est valable pendant 1 heure.</p>
    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
  `;

  return sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html: getEmailTemplate(content, "Réinitialiser mon mot de passe", resetUrl)
  });
}
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
 * Email de notification : devis généré (envoyé au prospect)
 */
export async function sendQuoteCreatedEmail(
  userId: string,
  projectName: string,
  pdfUrl: string,
  quoteNumber: string,
  quoteId: string
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Votre devis est prêt ! 📄</h2>
    <p>Bonjour ${userName},</p>
    <p>Suite à votre demande, voici le devis pour votre projet <strong>${projectName}</strong>.</p>
    <p>Pour valider le lancement du projet, merci de consulter et signer le devis en ligne :</p>

  `;

  return sendEmail({
    to: user.email,
    subject: `Votre devis pour le projet ${projectName} (Devis #${quoteNumber})`,
    html: getEmailTemplate(content, "Consulter le devis", `${appUrl}/quotes/${quoteId}/sign`)
  });
}

/**
 * Email de rappel : onboarding incomplet
 */
export async function sendOnboardingReminderEmail(
  userId: string,
  projectName: string,
  projectId: string,
  delay: "24h" | "48h" | "7days"
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";

  let subject = "";
  let content = "";
  const onboardingUrl = `${appUrl}/onboarding`;

  switch (delay) {
    case "24h":
      subject = "Vous êtes à 2 minutes de débloquer votre démo ✨";
      content = `
        <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName},</h2>
        <p>Vous avez commencé l’onboarding pour votre projet <strong>${projectName}</strong>, mais il manque encore quelques informations pour que je puisse avancer.</p>
        <p>👉 Dès que vous terminez, je vous envoie la démo personnalisée sous 24h.<br>
        👉 Votre devis se crée automatiquement juste après.</p>
        <p>Ça prend 2–3 minutes maximum.</p>
        <p style="margin: 24px 0;">
          <a href="${onboardingUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reprendre l’onboarding</a>
        </p>
        <p>Si quelque chose vous bloque, répondez simplement à cet email — je peux vous guider.</p>
      `;
      break;
    case "48h":
      subject = "On avance sur votre site ? 😊";
      content = `
        <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName},</h2>
        <p>Je vois que l’onboarding du projet <strong>${projectName}</strong> n’est pas encore terminé.</p>
        <p>Tant qu’il n’est pas complété, je ne peux pas :<br>
        ✔ lancer votre démo personnalisée,<br>
        ✔ générer votre devis,<br>
        ✔ démarrer votre projet.</p>
        <p>Bonne nouvelle : il ne vous reste que quelques étapes.</p>
        <p>Si vous préférez, répondez directement à cet email et je vous explique ce qu’il manque.</p>
      `;
      break;
    case "7days":
      subject = "Votre projet est toujours d’actualité ?";
      content = `
        <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName},</h2>
        <p>Cela fait maintenant 7 jours que l’onboarding du projet <strong>${projectName}</strong> n’a pas été finalisé.</p>
        <p>Je garde encore votre créneau de production ouvert, mais je ne pourrai pas le bloquer longtemps.</p>
        <p>Pour rappel, une fois l’onboarding complété :<br>
        ✔ Démo personnalisée envoyée sous 24h<br>
        ✔ Devis généré automatiquement<br>
        ✔ Démarrage immédiat après validation</p>
        <p>Si vous avez une question ou si quelque chose vous freine, dites-moi — je suis là pour vous accompagner.</p>
      `;
      break;
  }

  const ctaText = delay === "7days" ? "Terminer l’onboarding" : (delay === "48h" ? "Continuer l’onboarding" : "Reprendre l’onboarding");

  return sendEmail({
    to: user.email,
    subject,
    html: getEmailTemplate(content, ctaText, onboardingUrl, "Cet e-mail fait suite à votre demande de démo.", "Finalisez votre onboarding pour débloquer la suite.")
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
  const quoteUrl = `${appUrl}/quote/${quoteId}`;

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName},</h2>
    <p>Bonne nouvelle : votre devis pour le projet <strong>${projectName}</strong> est maintenant disponible.</p>
    <p>Vous pouvez le consulter et le signer directement ici :</p>
    <p>Dès votre signature :<br>
    1️⃣ Je lance la préparation de votre site<br>
    2️⃣ Vous recevez un planning sous 24h<br>
    3️⃣ Vous débloquez l’accès complet au système de tickets</p>
    <p>Et si vous souhaitez ajuster quelque chose, répondez simplement à ce message.</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Votre devis pour ${projectName} est prêt 📄`,
    html: getEmailTemplate(content, "Accéder au devis", quoteUrl, "Cet e-mail fait suite à votre demande.", "Votre devis est prêt à être signé.")
  });
}

/**
 * Email de rappel : devis non signé après 3 jours
 */
export async function sendQuoteReminderEmail(
  userId: string,
  projectName: string,
  quoteId: string,
  delay: "3days" | "7days"
) {
  const user = await getUserInfo(userId);
  if (!user.email) {
    return { success: false, error: "User email not found" };
  }

  const userName = user.name ?? "Bonjour";
  const quoteUrl = `${appUrl}/quote/${quoteId}`;
  let subject = "";
  let content = "";

  if (delay === "3days") {
    subject = `Toujours partant pour votre site ${projectName} ?`;
    content = `
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName},</h2>
      <p>Vous avez reçu votre devis pour <strong>${projectName}</strong> il y a quelques jours, mais il n’a pas encore été signé.</p>
      <p>Bonne nouvelle : il est toujours valable.</p>
      <p>Pour rappel, la signature débloque :<br>
      ✔ Le lancement immédiat du projet<br>
      ✔ Votre planning de livraison<br>
      ✔ Votre espace client complet</p>
      <p>Si quelque chose vous bloque, dites-moi — je peux ajuster le devis ou répondre à vos questions.</p>
    `;
  } else {
    subject = "Je garde votre créneau encore 48h";
    content = `
      <h2 style="color: #1a202c; margin-top: 0;">Bonjour ${userName},</h2>
      <p>Votre devis pour le projet <strong>${projectName}</strong> n’a toujours pas été signé après plusieurs relances.</p>
      <p>Je préfère être transparent :<br>
      ➡️ Votre créneau de production est encore réservé 48h.<br>
      Après ce délai, je ne pourrai plus garantir le même délai de livraison.</p>
      <p>Votre devis est toujours accessible ici :</p>
      <p>Si vous souhaitez modifier un point, ajuster le budget ou si quelque chose vous freine, répondez simplement à cet email.</p>
    `;
  }

  return sendEmail({
    to: user.email,
    subject,
    html: getEmailTemplate(content, "Accéder au devis", quoteUrl, "Rappel de votre devis en attente.", "Votre devis vous attend toujours.")
  });
}

/**
 * Notification interne : Prospect inactif (7 jours)
 */
export async function sendInternalInactivityNotification(
  prospectName: string,
  projectName: string,
  status: "onboarding_incomplete" | "quote_pending",
  crmLink?: string
) {
  const statusText = status === "onboarding_incomplete" ? "Onboarding incomplet" : "Devis non signé";

  const content = `
    <h2 style="color: #1a202c; margin-top: 0;">Prospect inactif : ${prospectName}</h2>
    <p>Le prospect <strong>${prospectName}</strong> (projet : <strong>${projectName}</strong>) est inactif depuis 7 jours.</p>
    <div style="background-color: #FEF2F2; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #FECACA;">
      <p style="margin: 0; color: #991B1B;"><strong>Statut :</strong> ${statusText}</p>
    </div>
    <p>Tu devrais probablement :</p>
    <ul>
      <li>📞 tenter un appel</li>
      <li>📱 envoyer un SMS rapide</li>
      <li>💬 ou un WhatsApp si plus adapté</li>
    </ul>
    ${crmLink ? `<p><a href="${crmLink}">Voir dans le CRM</a></p>` : ""}
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Prospect inactif : ${prospectName} - ${projectName}`,
    html: getEmailTemplate(content, "Ouvrir le dashboard", `${appUrl}/admin/clients`)
  });
}

