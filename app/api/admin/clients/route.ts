import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authUsers, profiles, projects, userCredentials } from "@/lib/schema";
import { clientCreateSchema } from "@/lib/zod-schemas";
import { assertStaff } from "@/lib/utils";
import { sendWelcomeEmail, sendProjectCreatedEmail } from "@/lib/emails";


export async function POST(request: NextRequest) {
  console.log("[Admin/Clients] POST request received");
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

  const { email, password, fullName, role } = parsed.data;

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
      role: "prospect" | "client";
      fullName?: string | null;
      company?: string | null;
      phone?: string | null;
    } = {
      id: userId,
      role: role ?? "prospect"
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

  // Créer automatiquement un projet pour le client
  let projectId: string | null = null;
  let projectName: string | null = null;

  try {
    // Utiliser le nom du client (fullName) ou l'email comme nom du projet
    const projectNameValue = fullName || email.split("@")[0] || "Nouveau projet";
    const initialStatus = role === "client" ? "delivered" : "onboarding";
    const initialProgress = role === "client" ? 100 : 10;

    const [createdProject] = await db
      .insert(projects)
      .values({
        ownerId: userId,
        name: projectNameValue,
        status: initialStatus,
        progress: initialProgress
      })
      .returning({
        id: projects.id,
        name: projects.name
      });

    projectId = createdProject.id;
    projectName = createdProject.name;
  } catch (error) {
    console.error("[Admin/Clients] Error creating project:", error);
    // Ne pas faire échouer la création du client si le projet échoue
    // On continue quand même
  }

  // Envoyer l'email de bienvenue avec identifiants
  console.log("[Admin/Clients] Sending welcome email...");
  console.log("[Admin/Clients] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

  const emailResult = await sendWelcomeEmail(
    userId,
    undefined,
    { email, password },
    { name: fullName || null, email }
  );

  console.log("[Admin/Clients] Email result:", emailResult);

  // Envoyer l'email de création de projet si le projet a été créé
  if (projectId && projectName) {
    sendProjectCreatedEmail(projectId, projectName, userId).catch((error) => {
      console.error("[Admin/Clients] Failed to send project created email:", error);
    });
  }

  return NextResponse.json(
    {
      ok: true,
      userId,
      projectId,
      projectName,
      emailSent: emailResult.success,
      emailMessage: emailResult.error ?? null
    },
    { status: 201 }
  );
}
