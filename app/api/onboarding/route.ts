// app/api/onboarding/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/onboarding  renvoie l'état/brouillon courant (stub)
export async function GET(_req: NextRequest) {
  // TODO: charger le brouillon depuis la DB (scopé par user + project)
  return NextResponse.json({ data: { draft: null } });
}

// POST /api/onboarding  enregistre brouillon ou validation finale (stub)
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  // TODO: auth + RBAC + upsert onboarding + éventuelle maj projects.status/progress
  return NextResponse.json({ ok: true, payload });
}
