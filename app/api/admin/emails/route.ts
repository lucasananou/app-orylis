import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
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

    // Préparer les variables JSONB de manière sûre
    // Utiliser sql.raw() pour éviter que Drizzle essaie de sérialiser l'objet
    let variablesJsonbValue: ReturnType<typeof sql.raw> | null = null;
    if (variables) {
      try {
        // S'assurer que c'est un objet/array valide et le sérialiser correctement
        const serialized = JSON.stringify(variables, (key, value) => {
          // Ignorer les fonctions et undefined
          if (typeof value === "function" || value === undefined) {
            return null;
          }
          // Convertir les dates en ISO string
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        });
        // Échapper les apostrophes et backslashes pour éviter les injections SQL
        const escapedJson = serialized.replace(/'/g, "''").replace(/\\/g, "\\\\");
        variablesJsonbValue = sql.raw(`'${escapedJson}'::jsonb`);
      } catch {
        variablesJsonbValue = null;
      }
    }

    // Vérifier si le template existe déjà
    const existingTemplate = await db.query.emailTemplates.findFirst({
      where: (templates, { eq }) => eq(templates.type, type as EmailTemplateType)
    });

    let template;
    if (existingTemplate) {
      // Mettre à jour le template existant en utilisant db.execute() pour tout
      if (variablesJsonbValue !== null) {
        await db.execute(
          sql`UPDATE ${emailTemplates} SET subject = ${subject}, html_content = ${htmlContent}, text_content = ${textContent ?? sql`NULL`}, variables = ${variablesJsonbValue} WHERE type = ${type}`
        );
      } else {
        await db.execute(
          sql`UPDATE ${emailTemplates} SET subject = ${subject}, html_content = ${htmlContent}, text_content = ${textContent ?? sql`NULL`}, variables = NULL WHERE type = ${type}`
        );
      }
    } else {
      // Créer un nouveau template en utilisant db.execute() pour tout
      if (variablesJsonbValue !== null) {
        await db.execute(
          sql`INSERT INTO ${emailTemplates} (type, subject, html_content, text_content, variables) VALUES (${type}, ${subject}, ${htmlContent}, ${textContent ?? sql`NULL`}, ${variablesJsonbValue})`
        );
      } else {
        await db.execute(
          sql`INSERT INTO ${emailTemplates} (type, subject, html_content, text_content, variables) VALUES (${type}, ${subject}, ${htmlContent}, ${textContent ?? sql`NULL`}, NULL)`
        );
      }
    }
    
    // Récupérer le template créé/mis à jour
    const result = await db.query.emailTemplates.findFirst({
      where: (templates, { eq }) => eq(templates.type, type as EmailTemplateType)
    });
    if (!result) {
      throw new Error("Failed to retrieve template");
    }
    template = result;

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("[Admin/Emails] Failed to save template:", error);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}

