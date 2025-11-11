import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: true, message: "Webhook Make non implémenté (MVP placeholder)." },
    { status: 202 }
  );
}

