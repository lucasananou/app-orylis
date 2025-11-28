import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/schema";
import { notificationPreferencesSchema } from "@/lib/zod-schemas";
import { ensureNotificationDefaults } from "@/lib/notifications";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const prefs = await ensureNotificationDefaults(session.user.id, session.user.role);
  return NextResponse.json({ data: prefs });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const validation = notificationPreferencesSchema.safeParse(payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: validation.error.flatten()
      },
      { status: 400 }
    );
  }

  await ensureNotificationDefaults(session.user.id, session.user.role);

  await db
    .update(notificationPreferences)
    .set({
      ...validation.data,
      updatedAt: new Date()
    })
    .where(eq(notificationPreferences.userId, session.user.id));

  const refreshed = await db.query.notificationPreferences.findFirst({
    where: (prefs, { eq: eqFn }) => eqFn(prefs.userId, session.user.id)
  });

  return NextResponse.json({ ok: true, data: refreshed });
}
