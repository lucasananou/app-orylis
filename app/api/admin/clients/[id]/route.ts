import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, projects, userCredentials, authUsers } from "@/lib/schema";
import { assertStaff } from "@/lib/utils";
import { sendProspectPromotedEmail } from "@/lib/emails";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["prospect", "client"])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return NextResponse.json({ error: "Accès réservé au staff." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateRoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
    columns: { id: true, role: true }
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  // Ne pas permettre de changer le rôle d'un staff
  if (profile.role === "staff") {
    return NextResponse.json(
      { error: "Impossible de modifier le rôle d'un membre du staff." },
      { status: 403 }
    );
  }

  console.log(`[Admin/Clients] Updating role for ${id} to ${parsed.data.role}`);
  const oldRole = profile.role;
  await db.update(profiles).set({ role: parsed.data.role }).where(eq(profiles.id, id));
  console.log(`[Admin/Clients] Role updated successfully.`);

  // Envoyer un email si le prospect est promu en client
  if (oldRole === "prospect" && parsed.data.role === "client") {
    sendProspectPromotedEmail(id).catch((error) => {
      console.error("[Email] Failed to send prospect promoted email:", error);
    });
  }

  return NextResponse.json({ ok: true, role: parsed.data.role });
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return NextResponse.json({ error: "Accès réservé au staff." }, { status: 403 });
  }

  const { id } = await params;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
    columns: { id: true, role: true }
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  if (profile.role === "staff") {
    return NextResponse.json(
      { error: "Impossible de supprimer un membre du staff." },
      { status: 403 }
    );
  }

  try {
    // Suppression en cascade via la base de données
    // La suppression de l'utilisateur auth entraîne la suppression du profil, des projets, etc.
    await db.delete(authUsers).where(eq(authUsers.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin/Clients] Error deleting client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du client." },
      { status: 500 }
    );
  }
}
