import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, profiles, quotes, authUsers } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { generateQuotePDF } from "@/lib/quote-generator";
import { sendQuoteCreatedEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = session.user!;
  const isStaffUser = ["staff", "admin", "sales"].includes(user.role);

  if (!isProspect(user.role) && !isStaffUser) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée aux prospects et à l'équipe." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    let projectId = body.projectId;

    // Si c'est un prospect, on force l'utilisation de son propre projet
    if (isProspect(user.role)) {
      const project = await db.query.projects.findFirst({
        where: eq(projects.ownerId, user.id),
        columns: { id: true },
        orderBy: (projects, { asc }) => [asc(projects.createdAt)]
      });
      if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
      projectId = project.id;
    }

    if (!projectId) {
      return NextResponse.json({ error: "ID du projet requis." }, { status: 400 });
    }

    // Récupérer le projet
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: {
        id: true,
        name: true,
        ownerId: true
      }
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
      if (existingQuote.status === "pending") {
        // RESEND LOGIC
        const authUser = await db.query.authUsers.findFirst({
          where: eq(authUsers.id, project.ownerId),
          columns: { email: true }
        });

        // Retrieve quote number
        const fullQuote = await db.query.quotes.findFirst({
          where: eq(quotes.id, existingQuote.id),
          columns: { number: true, pdfUrl: true }
        });

        if (authUser?.email && fullQuote) {
          const quoteNumber = (fullQuote.number ?? 0).toString().padStart(6, "0");
          await sendQuoteCreatedEmail(project.ownerId, project.name, fullQuote.pdfUrl, quoteNumber, existingQuote.id);

          return NextResponse.json({
            success: true,
            quoteId: existingQuote.id,
            pdfUrl: fullQuote.pdfUrl,
            resent: true,
            message: "Devis renvoyé avec succès."
          });
        }
      }

      return NextResponse.json(
        { error: "Un devis existe déjà pour ce projet.", quoteId: existingQuote.id },
        { status: 400 }
      );
    }

    // Récupérer les informations du propriétaire du projet (prospect)
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, project.ownerId),
      columns: {
        fullName: true,
        company: true,
        phone: true
      }
    });

    const authUser = await db.query.authUsers.findFirst({
      where: eq(authUsers.id, project.ownerId),
      columns: {
        email: true,
        name: true
      }
    });

    const prospectName = profile?.fullName ?? authUser?.name ?? "Client";
    const prospectEmail = authUser?.email ?? "";
    const companyName = profile?.company ?? null;

    // Générer le numéro de devis séquentiel
    // 1. Récupérer le dernier numéro
    const lastQuote = await db.query.quotes.findFirst({
      orderBy: (quotes, { desc }) => [desc(quotes.number)],
      columns: { number: true }
    });

    const nextNumber = (lastQuote?.number ?? 0) + 1;
    const quoteNumber = nextNumber.toString().padStart(6, "0");

    // Générer le PDF
    const pdfUrl = await generateQuotePDF({
      prospectName,
      prospectEmail,
      prospectPhone: profile?.phone ?? null,
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
        number: nextNumber,
        status: "pending"
      })
      .returning({ id: quotes.id });

    // Envoyer l'email au prospect (sans bloquer la réponse si erreur)
    await sendQuoteCreatedEmail(project.ownerId, project.name, pdfUrl, quoteNumber, newQuote.id).catch(err =>
      console.error("Failed to send quote email:", err)
    );

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
