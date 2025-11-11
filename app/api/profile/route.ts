import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { profileUpdateSchema } from "@/lib/zod-schemas";
import { safeJson } from "@/lib/utils";

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return safeJson({ error: "Non authentifié." }, 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return safeJson(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten()
      },
      400
    );
  }

  const updatePayload = {
    fullName: parsed.data.full_name,
    company: parsed.data.company,
    phone: parsed.data.phone
  };

  await db
    .update(profiles)
    .set(updatePayload)
    .where(eq(profiles.id, session.user.id));

  const updatedProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.user.id),
    columns: {
      id: true,
      fullName: true,
      company: true,
      phone: true,
      role: true,
      createdAt: true
    }
  });

  return safeJson({
    ok: true,
    profile: updatedProfile
  });
}

