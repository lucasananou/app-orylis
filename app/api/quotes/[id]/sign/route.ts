import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, projects } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PDFDocument, rgb } from "pdf-lib";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
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
    const { id } = await ctx.params;
    const body = await req.json();
    const { signatureDataUrl } = body;

    if (!signatureDataUrl) {
      return NextResponse.json({ error: "Signature requise." }, { status: 400 });
    }

    // Récupérer le devis
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, id),
      columns: {
        id: true,
        projectId: true,
        pdfUrl: true,
        status: true
      }
    });

    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    }

    // Vérifier que le devis appartient au prospect
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, quote.projectId),
      columns: {
        ownerId: true
      }
    });

    if (!project || project.ownerId !== user.id) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    if (quote.status !== "pending") {
      return NextResponse.json(
        { error: "Ce devis a déjà été signé ou annulé." },
        { status: 400 }
      );
    }

    // Télécharger le PDF original
    const pdfResponse = await fetch(quote.pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error("Failed to fetch PDF");
    }
    const pdfBytes = await pdfResponse.arrayBuffer();

    // Charger le PDF avec pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    // Convertir la signature en image
    const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

    // Ajouter la signature en bas de la dernière page
    const signatureWidth = 150;
    const signatureHeight = (signatureImage.height * signatureWidth) / signatureImage.width;
    const signatureX = width - signatureWidth - 50;
    const signatureY = 100;

    lastPage.drawImage(signatureImage, {
      x: signatureX,
      y: signatureY,
      width: signatureWidth,
      height: signatureHeight
    });

    // Ajouter la date de signature
    const font = await pdfDoc.embedFont("Helvetica");
    lastPage.drawText(`Signé le ${new Date().toLocaleDateString("fr-FR")}`, {
      x: signatureX,
      y: signatureY - 20,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4)
    });

    // Générer le PDF signé
    const signedPdfBytes = await pdfDoc.save();

    // Vérifier que le token est configuré
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      throw new Error("BLOB_READ_WRITE_TOKEN n'est pas défini");
    }

    // Upload le PDF signé sur Vercel Blob
    const fileName = `quotes/quote-signed-${id}-${Date.now()}.pdf`;
    const blob = await put(fileName, signedPdfBytes, {
      access: "public",
      contentType: "application/pdf",
      token: blobToken
    });

    // Mettre à jour le devis
    await db
      .update(quotes)
      .set({
        signedPdfUrl: blob.url,
        status: "signed",
        signedAt: new Date()
      })
      .where(eq(quotes.id, id));

    return NextResponse.json({
      success: true,
      signedPdfUrl: blob.url
    });
  } catch (error) {
    console.error("[Quotes/Sign] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la signature du devis." },
      { status: 500 }
    );
  }
}

