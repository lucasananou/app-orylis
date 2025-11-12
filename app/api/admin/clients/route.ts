import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authUsers, profiles, userCredentials } from "@/lib/schema";
import { clientCreateSchema } from "@/lib/zod-schemas";
import { assertStaff } from "@/lib/utils";

interface EmailResult {
  sent: boolean;
  message?: string;
  provider?: string;
}

async function sendWelcomeEmail(params: {
  email: string;
  password: string;
  fullName?: string | null;
}): Promise<EmailResult> {
  const { email, password, fullName } = params;
  const subject = "Votre accès à Orylis Hub";
  const displayName = fullName ?? "Bonjour";
  const from = process.env.EMAIL_FROM ?? "noreply@orylis.fr";
  const html = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background-color: #F7F9FB;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px;">
        <tr>
          <td>
            <h1 style="color: #0F172A; font-size: 20px; font-weight: 600; margin: 0 0 16px;">${displayName}, bienvenue sur Orylis Hub 👋</h1>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              Votre compte a été créé par l’équipe Orylis. Voici vos identifiants de connexion :
            </p>
            <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; color: #0F172A;"><strong>Email :</strong> ${email}</p>
              <p style="margin: 8px 0 0 0; color: #0F172A;"><strong>Mot de passe :</strong> ${password}</p>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              Vous pouvez vous connecter dès maintenant via <a href="${process.env.NEXTAUTH_URL ?? "#"}" style="color: #43b2b9;">Orylis Hub</a>.
            </p>
            <p style="color: #64748B; font-size: 13px; line-height: 1.6; margin: 0;">
              Pour des raisons de sécurité, pensez à modifier votre mot de passe après la première connexion.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `.trim();

  const text = `
${displayName},

Votre compte Orylis Hub a été créé.

Identifiants :
- Email : ${email}
- Mot de passe : ${password}

Connectez-vous : ${process.env.NEXTAUTH_URL ?? "#"}

Pensez à changer votre mot de passe après la première connexion.

L’équipe Orylis
`.trim();

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[EMAIL:CLIENT_CREATED]\nTo: ${email}\nSubject: ${subject}\nPassword: ${password}\n---\n${text}`
    );
    return {
      sent: false,
      message: "Email non envoyé (mode développement). Message loggué dans la console."
    };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from,
        to: email,
        subject,
        html,
        text
      });
      return { sent: true, provider: "resend" };
    } catch (error) {
      console.error("[Auth] Unable to send welcome email via Resend:", error);
      return { sent: false, message: "Échec de l’envoi via Resend." };
    }
  }

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT ?? 587),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      await transport.sendMail({
        from,
        to: email,
        subject,
        html,
        text
      });
      return { sent: true, provider: "smtp" };
    } catch (error) {
      console.error("[Auth] Unable to send welcome email via SMTP:", error);
      return { sent: false, message: "Échec de l’envoi via SMTP." };
    }
  }

  console.warn("[Auth] Aucun fournisseur d’email configuré. Email non envoyé.");
  return { sent: false, message: "Aucun fournisseur d’email configuré." };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return NextResponse.json({ error: "Accès réservé au staff." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = clientCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Données invalides.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const { email, password, fullName } = parsed.data;

  const existingUser = await db.query.authUsers.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
    columns: {
      id: true
    }
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Cet email est déjà associé à un compte." },
      { status: 409 }
    );
  }

  const userId = randomUUID();

  try {
    // Insérer l'utilisateur sans les champs optionnels null
    const userValues: {
      id: string;
      email: string;
      name?: string | null;
    } = {
      id: userId,
      email
    };
    
    if (fullName) {
      userValues.name = fullName;
    }
    
    await db.insert(authUsers).values(userValues);
  } catch (error) {
    console.error("[Admin/Clients] Error inserting authUsers:", error);
    throw error;
  }

  try {
    // Insérer le profil sans les champs avec valeurs par défaut
    const profileValues: {
      id: string;
      role: "client";
      fullName?: string | null;
      company?: string | null;
      phone?: string | null;
    } = {
      id: userId,
      role: "client"
    };
    
    if (fullName) {
      profileValues.fullName = fullName;
    }
    
    await db
      .insert(profiles)
      .values(profileValues)
      .onConflictDoNothing({ target: profiles.id });
  } catch (error) {
    console.error("[Admin/Clients] Error inserting profiles:", error);
    throw error;
  }

  const passwordHash = await hash(password, 12);

  try {
    // Vérifier si les credentials existent déjà
    const existingCredentials = await db.query.userCredentials.findFirst({
      where: (creds, { eq }) => eq(creds.userId, userId),
      columns: { userId: true }
    });

    if (existingCredentials) {
      // Mettre à jour uniquement le passwordHash
      await db
        .update(userCredentials)
        .set({ passwordHash })
        .where(eq(userCredentials.userId, userId));
    } else {
      // Insérer les credentials sans les champs avec valeurs par défaut
      await db.insert(userCredentials).values({
        userId,
        passwordHash
        // createdAt et updatedAt sont omis, les valeurs par défaut seront utilisées
      });
    }
  } catch (error) {
    console.error("[Admin/Clients] Error inserting/updating userCredentials:", error);
    throw error;
  }

  const emailResult = await sendWelcomeEmail({ email, password, fullName });

  return NextResponse.json(
    {
      ok: true,
      userId,
      emailSent: emailResult.sent,
      emailMessage: emailResult.message ?? null
    },
    { status: 201 }
  );
}

