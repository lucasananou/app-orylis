import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { authUsers, profiles, projects, userCredentials } from "@/lib/schema";
import { ensureNotificationDefaults } from "@/lib/notifications";
import { sendProspectWelcomeEmail, sendProspectSignupEmailToAdmin } from "@/lib/emails";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  // Rendre le mot de passe optionnel (généré côté serveur si absent)
  password: z.string().min(8).optional(),
  fullName: z.string().optional(),
  company: z.string().optional()
  // Téléphone supprimé - sera demandé à l'onboarding pour réduire la friction
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, fullName, company } = parsed.data;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.query.authUsers.findFirst({
      where: eq(authUsers.email, email),
      columns: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Créer l'utilisateur
    const userId = randomUUID();

    // Générer un mot de passe si non fourni
    const rawPassword = password && password.length >= 8 ? password : crypto.randomBytes(12).toString("base64url");

    // Paralléliser le hash du mot de passe et la préparation des données
    const [passwordHash, projectName] = await Promise.all([
      hash(rawPassword, 10), // 10 rounds (sécurisé + rapide)
      Promise.resolve(
        company ? `Site ${company}` : fullName ? `Site ${fullName}` : "Mon site web"
      )
    ]);

    // IMPORTANT: exécuter en transaction, et insérer l'utilisateur AVANT les FKs
    const projectResult = await db.transaction(async (tx) => {
      // 1) Créer l'utilisateur (FK parent)
      await tx.insert(authUsers).values({
        id: userId,
        email,
        name: fullName ?? null,
        emailVerified: null,
        image: null
      });

      // 2) Créer le profil (FK vers user)
      const referrerId = req.cookies.get("orylis_referrer")?.value;

      await tx.insert(profiles).values({
        id: userId,
        role: "prospect",
        fullName: fullName ?? null,
        company: company ?? null,
        referrerId: referrerId ?? null
        // Téléphone sera ajouté lors de l'onboarding
      });

      // 3) Créer les credentials (FK vers user)
      await tx.insert(userCredentials).values({
        userId,
        passwordHash
      });

      // 4) Créer le projet par défaut
      const createdProject = await tx
        .insert(projects)
        .values({
          ownerId: userId,
          name: projectName,
          status: "onboarding",
          progress: 10
        })
        .returning({ id: projects.id });

      return createdProject;
    });

    const project = projectResult?.[0];

    // Ne pas attendre les notifications et emails (fire and forget)
    Promise.all([
      ensureNotificationDefaults(userId, "prospect").catch((error) => {
        console.error("[Notifications] Failed to ensure defaults:", error);
      }),
      sendProspectWelcomeEmail(userId, projectName).catch((error) => {
        console.error("[Email] Failed to send welcome email:", error);
      }),
      sendProspectSignupEmailToAdmin(userId, projectName).catch((error) => {
        console.error("[Email] Failed to notify admin about signup:", error);
      }),
      // Webhook Make pour nurturing (fire and forget)
      fetch("https://hook.eu2.make.com/haj2axn8unnanjwwer8fcheckm95kvd5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          fullName,
          company,
          projectId: project?.id,
          createdAt: new Date().toISOString()
        })
      }).catch((error) => {
        console.error("[Webhook] Failed to trigger signup webhook:", error);
      })
    ]).catch(() => {
      // Ignorer les erreurs, on ne veut pas bloquer la réponse
    });

    return NextResponse.json({
      ok: true,
      userId,
      projectId: project?.id,
      // On renvoie le mot de passe effectif pour la connexion immédiate côté client
      password: rawPassword
    });
  } catch (error) {
    console.error("[Signup] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}

