import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authUsers, profiles, userCredentials } from "@/lib/schema";
import { clientCreateSchema } from "@/lib/zod-schemas";
import { assertStaff } from "@/lib/utils";
import { sendWelcomeEmailWithCredentials } from "@/lib/emails";


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

  // Envoyer l'email de bienvenue avec identifiants
  const emailResult = await sendWelcomeEmailWithCredentials(email, password, fullName);

  return NextResponse.json(
    {
      ok: true,
      userId,
      emailSent: emailResult.success,
      emailMessage: emailResult.error ?? null
    },
    { status: 201 }
  );
}

