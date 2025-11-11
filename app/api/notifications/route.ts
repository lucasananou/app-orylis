import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  countUnreadNotifications,
  listNotifications,
  markNotifications,
  ensureNotificationDefaults
} from "@/lib/notifications";
import { notificationMarkSchema } from "@/lib/zod-schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  await ensureNotificationDefaults(session.user.id, session.user.role);

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") as "unread" | "all" | null) ?? "all";
  const limitParam = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;

  const items = await listNotifications({
    userId: session.user.id,
    status,
    limit
  });

  const unread = await countUnreadNotifications(session.user.id);

  return NextResponse.json({ data: items, unread });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const validation = notificationMarkSchema.safeParse(payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: validation.error.flatten()
      },
      { status: 400 }
    );
  }

  const { ids, all } = validation.data;
  const updatedCount = await markNotifications({
    userId: session.user.id,
    ids,
    markAll: all ?? false
  });

  const unread = await countUnreadNotifications(session.user.id);

  return NextResponse.json({ ok: true, updated: updatedCount, unread });
}
