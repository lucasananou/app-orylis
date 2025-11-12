import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isStaff } from "@/lib/utils";
import type { EmailTemplateType } from "@/lib/emails";

export const dynamic = "force-dynamic";

// GET : Récupérer tous les templates
export async function GET() {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await db.query.emailTemplates.findMany({
      orderBy: (templates, { asc }) => asc(templates.type)
    });

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("[Admin/Emails] Failed to fetch templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

// POST : Créer ou mettre à jour un template
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, subject, htmlContent, textContent, variables } = body;

    if (!type || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "type, subject, and htmlContent are required" },
        { status: 400 }
      );
    }

    // Vérifier que le type est valide
    const validTypes: EmailTemplateType[] = [
      "welcome",
      "ticket_created",
      "ticket_reply",
      "ticket_updated",
      "file_uploaded",
      "onboarding_completed",
      "project_updated"
    ];

    if (!validTypes.includes(type as EmailTemplateType)) {
      return NextResponse.json({ error: "Invalid template type" }, { status: 400 });
    }

    // Upsert le template
    const [template] = await db
      .insert(emailTemplates)
      .values({
        type: type as EmailTemplateType,
        subject,
        htmlContent,
        textContent: textContent ?? null,
        variables: variables ? JSON.parse(JSON.stringify(variables)) : null
      })
      .onConflictDoUpdate({
        target: emailTemplates.type,
        set: {
          subject,
          htmlContent,
          textContent: textContent ?? null,
          variables: variables ? JSON.parse(JSON.stringify(variables)) : null,
          updatedAt: new Date()
        }
      })
      .returning();

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("[Admin/Emails] Failed to save template:", error);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}

