// app/api/files/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/files?projectId=... — stub listing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  return NextResponse.json({ data: [], projectId });
}

// POST /api/files — stub creation
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  // TODO: auth + RBAC + create file row + blob
  return NextResponse.json({ ok: true, payload });
}
