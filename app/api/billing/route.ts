// app/api/billing/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isProspect, canAccessBilling } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Vérifier que l'utilisateur n'est pas un prospect
  if (isProspect(session.user.role)) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée aux clients. Contactez-nous pour activer votre accès complet." },
      { status: 403 }
    );
  }

  // Stub minimal pour compiler (tu remettras la logique RBAC/DB ensuite)
  return NextResponse.json({ data: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Vérifier que l'utilisateur n'est pas un prospect
  if (isProspect(session.user.role)) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée aux clients. Contactez-nous pour activer votre accès complet." },
      { status: 403 }
    );
  }

  // Stub: on accepte le payload et on confirme
  const payload = await req.json().catch(() => null);
  return NextResponse.json({ ok: true, payload });
}
