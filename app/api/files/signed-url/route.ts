// app/api/files/signed-url/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/files/signed-url?fileId=...  stub download URL
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  // TODO: auth + RBAC + generate signed download URL
  return NextResponse.json({ url: null, fileId });
}

// POST /api/files/signed-url  stub upload URL
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  // TODO: auth + RBAC + generate upload URL
  return NextResponse.json({ uploadUrl: null, payload });
}
