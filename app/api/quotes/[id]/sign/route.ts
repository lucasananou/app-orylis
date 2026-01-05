import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, projects, profiles, authUsers, files } from "@/lib/schema";
import { isProspect } from "@/lib/utils";
import { PDFDocument, rgb } from "pdf-lib";
import { put } from "@vercel/blob";
import {
  sendQuoteSignedEmailToProspect,
  sendQuoteSignedEmailToAdmin
} from "@/lib/emails";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = session.user!;

  const isStaff = user.role === "staff";

  if (!isProspect(user.role) && !isStaff) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée aux prospects et à l'équipe." },
      { status: 403 }
    );
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { signatureDataUrl } = body;

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
        ownerId: true,
        name: true
      }
    });

    if (!project || (project.ownerId !== user.id && !isStaff)) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    // Récupérer les infos du propriétaire du projet (et non du signataire si c'est un staff)
    const targetUserId = isStaff ? project.ownerId : user.id;

    const [profile, authUser] = await Promise.all([
      db.query.profiles.findFirst({
        where: eq(profiles.id, targetUserId),
        columns: { fullName: true }
      }),
      db.query.authUsers.findFirst({
        where: eq(authUsers.id, targetUserId),
        columns: { email: true, name: true }
      })
    ]);

    const prospectName = profile?.fullName ?? authUser?.name ?? "Client";
    const prospectEmail = authUser?.email ?? "";
    let signedPdfUrl = null;

    // --- CAS 1 : SIGNATURE (Si le devis est encore "pending") ---
    if (quote.status === "pending") {
      if (!signatureDataUrl) {
        return NextResponse.json({ error: "Signature requise." }, { status: 400 });
      }

      // Télécharger le PDF original
      const pdfResponse = await fetch(quote.pdfUrl);
      if (!pdfResponse.ok) throw new Error("Failed to fetch PDF");
      const pdfBytes = await pdfResponse.arrayBuffer();

      // Charger le PDF avec pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width } = lastPage.getSize();

      // Convertir la signature en image
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

      // Ajouter la signature
      const signatureBoxWidth = 220;
      const signatureBoxHeight = 120;
      const margin = 50;
      const signatureBoxX = width - margin - signatureBoxWidth;
      const signatureBoxY = margin + 60;

      const maxSignatureWidth = signatureBoxWidth - 20;
      const maxSignatureHeight = signatureBoxHeight - 20;
      let drawWidth = maxSignatureWidth;
      let drawHeight = (signatureImage.height * drawWidth) / signatureImage.width;
      if (drawHeight > maxSignatureHeight) {
        drawHeight = maxSignatureHeight;
        drawWidth = (signatureImage.width * drawHeight) / signatureImage.height;
      }
      const signatureX = signatureBoxX + (signatureBoxWidth - drawWidth) / 2;
      const signatureY = signatureBoxY + (signatureBoxHeight - drawHeight) / 2;

      lastPage.drawImage(signatureImage, {
        x: signatureX,
        y: signatureY,
        width: drawWidth,
        height: drawHeight
      });

      // Ajouter la date
      const font = await pdfDoc.embedFont("Helvetica");
      lastPage.drawText(`Signé le ${new Date().toLocaleDateString("fr-FR")}`, {
        x: signatureBoxX,
        y: signatureBoxY - 16,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4)
      });

      // Sauvegarder et Upload
      const signedPdfBytes = await pdfDoc.save();
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (!blobToken) throw new Error("BLOB_READ_WRITE_TOKEN missing");

      const fileName = `quotes/quote-signed-${id}-${Date.now()}.pdf`;
      const blob = await put(fileName, Buffer.from(signedPdfBytes), {
        access: "public",
        contentType: "application/pdf",
        token: blobToken
      });
      signedPdfUrl = blob.url;

      // Update DB
      await db.update(quotes).set({
        signedPdfUrl: blob.url,
        status: "signed",
        signedAt: sql`now()`,
        updatedAt: sql`now()`
      }).where(eq(quotes.id, id));

      // Insert File
      try {
        await db.insert(files).values({
          path: blob.url,
          label: `Devis signé - ${project.name}.pdf`,
          storageProvider: "blob",
          projectId: quote.projectId,
          uploaderId: user.id,
          createdAt: new Date()
        });
      } catch (e) { console.error("File insert failed", e); }

      // Send Emails
      try {
        await Promise.all([
          sendQuoteSignedEmailToProspect(targetUserId, project.name, id, blob.url),
          sendQuoteSignedEmailToAdmin(id, project.name, prospectName, prospectEmail, blob.url)
        ]);
      } catch (e) { console.error("Email send failed", e); }
    } else if (quote.status !== "signed") {
      return NextResponse.json({ error: "Ce devis a été annulé." }, { status: 400 });
    }

    // --- CAS 2 : PAIEMENT (Toujours exécuté si prospect, que ce soit après signature ou retour ultérieur) ---

    // Créer une session de paiement pour l'acompte
    let checkoutUrl = null;
    try {
      const { DEPOSIT_PRICE_ID } = await import("@/lib/stripe-config");
      const { stripe } = await import("@/lib/stripe");

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: DEPOSIT_PRICE_ID,
            quantity: 1,
          },
        ],
        metadata: {
          projectId: quote.projectId,
          userId: user.id,
          type: "deposit",
          quoteId: id
        },
        customer_email: user.email || undefined,
        allow_promotion_codes: true,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?success=deposit_paid`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${id}/sign?canceled=true`,
      });

      checkoutUrl = session.url;
      console.log("[Quotes/Sign] Checkout session created:", checkoutUrl);
    } catch (stripeError) {
      console.error("[Quotes/Sign] Failed to create checkout session:", stripeError);
    }

    return NextResponse.json({
      success: true,
      signedPdfUrl: signedPdfUrl,
      checkoutUrl
    });

  } catch (error) {
    console.error("[Quotes/Sign] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la signature du devis." },
      { status: 500 }
    );
  }
}
