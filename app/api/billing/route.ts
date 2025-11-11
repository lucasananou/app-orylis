// app/api/billing/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  // Stub minimal pour compiler (tu remettras la logique RBAC/DB ensuite)
  return NextResponse.json({ data: [] });
}

export async function POST(req: NextRequest) {
  // Stub: on accepte le payload et on confirme
  const payload = await req.json().catch(() => null);
  return NextResponse.json({ ok: true, payload });
}
