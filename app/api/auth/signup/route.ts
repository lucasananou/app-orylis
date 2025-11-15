import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { authUsers, profiles, projects, userCredentials } from "@/lib/schema";
import { ensureNotificationDefaults } from "@/lib/notifications";
import { sendProspectWelcomeEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  fullName: z.string().optional(),
  company: z.string().optional()
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
    
    // Paralléliser le hash du mot de passe et la préparation des données
    const [passwordHash, projectName] = await Promise.all([
      hash(password, 10), // Réduit de 12 à 10 rounds pour améliorer la vitesse (toujours sécurisé)
      Promise.resolve(
        company ? `Site ${company}` : fullName ? `Site ${fullName}` : "Mon site web"
      )
    ]);

    // Paralléliser toutes les insertions DB
    const [, , , projectResult] = await Promise.all([
      // Créer l'utilisateur dans authUsers (table NextAuth)
      db.insert(authUsers).values({
        id: userId,
        email,
        name: fullName ?? null,
        emailVerified: null,
        image: null
      }),
      // Créer les credentials (mot de passe hashé)
      db.insert(userCredentials).values({
        userId,
        passwordHash
      }),
      // Créer le profil avec rôle "prospect"
      db.insert(profiles).values({
        id: userId,
        role: "prospect",
        fullName: fullName ?? null,
        company: company ?? null,
        phone: null
      }),
      // Créer un projet automatiquement pour le prospect
      db
        .insert(projects)
        .values({
          ownerId: userId,
          name: projectName,
          status: "onboarding",
          progress: 10
        })
        .returning({ id: projects.id })
    ]);

    const project = projectResult?.[0];

    // Ne pas attendre les notifications et emails (fire and forget)
    Promise.all([
      ensureNotificationDefaults(userId, "prospect").catch((error) => {
        console.error("[Notifications] Failed to ensure defaults:", error);
      }),
      sendProspectWelcomeEmail(userId, projectName).catch((error) => {
        console.error("[Email] Failed to send prospect welcome email:", error);
      })
    ]).catch(() => {
      // Ignorer les erreurs, on ne veut pas bloquer la réponse
    });

    return NextResponse.json({
      ok: true,
      userId,
      projectId: project?.id
    });
  } catch (error) {
    console.error("[Signup] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}

