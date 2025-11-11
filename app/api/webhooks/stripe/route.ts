import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: true, message: "Stripe webhook stub. À implémenter dans la V2." },
    { status: 202 }
  );
}

