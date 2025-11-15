import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { authUsers, profiles, projects, userCredentials } from "@/lib/schema";
import { ensureNotificationDefaults } from "@/lib/notifications";

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
    const passwordHash = await hash(password, 12);

    // Créer l'utilisateur dans authUsers (table NextAuth)
    await db.insert(authUsers).values({
      id: userId,
      email,
      name: fullName ?? null,
      emailVerified: null,
      image: null
    });

    // Créer les credentials (mot de passe hashé)
    await db.insert(userCredentials).values({
      userId,
      passwordHash
    });

    // Créer le profil avec rôle "prospect"
    await db.insert(profiles).values({
      id: userId,
      role: "prospect",
      fullName: fullName ?? null,
      company: company ?? null,
      phone: null
    });

    // Créer un projet automatiquement pour le prospect
    const projectName = company
      ? `Site ${company}`
      : fullName
        ? `Site ${fullName}`
        : "Mon site web";

    const [project] = await db
      .insert(projects)
      .values({
        ownerId: userId,
        name: projectName,
        status: "onboarding",
        progress: 10
      })
      .returning({ id: projects.id });

    // Créer les préférences de notification par défaut
    await ensureNotificationDefaults(userId, "prospect");

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

