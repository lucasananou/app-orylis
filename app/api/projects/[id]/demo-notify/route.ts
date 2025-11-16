import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, authUsers } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { sendProspectDemoReadyEmailStaticTo } from "@/lib/emails";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!isStaff(session.user.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const { id } = await ctx.params;

  const proj = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    columns: { ownerId: true, name: true }
  });
  if (!proj) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const owner = await db.query.authUsers.findFirst({
    where: eq(authUsers.id, proj.ownerId),
    columns: { email: true }
  });

  const result = await sendProspectDemoReadyEmailStaticTo(owner?.email ?? "");
  if (!result.success) {
    console.error("[Demo Notify] Email not sent:", result.error);
    return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 200 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}


