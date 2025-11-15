import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, profiles, quotes, authUsers } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { generateQuotePDF } from "@/lib/quote-generator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = session.user!;

  if (!isProspect(user.role)) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée aux prospects." },
      { status: 403 }
    );
  }

  try {
    // Récupérer le projet du prospect
    const project = await db.query.projects.findFirst({
      where: eq(projects.ownerId, user.id),
      columns: {
        id: true,
        name: true
      },
      orderBy: (projects, { asc }) => [asc(projects.createdAt)]
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    // Vérifier si un devis existe déjà pour ce projet
    const existingQuote = await db.query.quotes.findFirst({
      where: eq(quotes.projectId, project.id),
      columns: {
        id: true,
        status: true
      }
    });

    if (existingQuote) {
      return NextResponse.json(
        { error: "Un devis existe déjà pour ce projet.", quoteId: existingQuote.id },
        { status: 400 }
      );
    }

    // Récupérer les informations du prospect
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: {
        fullName: true,
        company: true
      }
    });

    const authUser = await db.query.authUsers.findFirst({
      where: eq(authUsers.id, user.id),
      columns: {
        email: true,
        name: true
      }
    });

    const prospectName = profile?.fullName ?? authUser?.name ?? "Client";
    const prospectEmail = authUser?.email ?? "";
    const companyName = profile?.company ?? null;

    // Générer le numéro de devis (format: Q-YYYYMMDD-XXX)
    const quoteNumber = `Q-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

    // Générer le PDF
    const pdfUrl = await generateQuotePDF({
      prospectName,
      prospectEmail,
      companyName,
      projectName: project.name,
      quoteNumber
    });

    // Créer le devis en base de données
    const [newQuote] = await db
      .insert(quotes)
      .values({
        projectId: project.id,
        pdfUrl,
        status: "pending"
      })
      .returning({ id: quotes.id });

    return NextResponse.json({
      success: true,
      quoteId: newQuote.id,
      pdfUrl
    });
  } catch (error) {
    console.error("[Quotes/Generate] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du devis." },
      { status: 500 }
    );
  }
}

