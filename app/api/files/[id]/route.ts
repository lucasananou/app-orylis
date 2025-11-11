// app/api/files/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/files/[id]  stub pour build (remets ta logique RBAC/DB ensuite)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ data: { id, ok: true } });
}

// DELETE /api/files/[id]  stub pour build
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // TODO: auth + RBAC + suppression blob + DB
  return NextResponse.json({ ok: true, deletedId: id });
}
