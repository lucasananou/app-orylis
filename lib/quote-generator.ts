/**
 * Service de génération de devis PDF
 */

// Utiliser la version standalone de pdfkit qui inclut les polices standard
import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";
import { put } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";

export interface QuoteData {
  prospectName: string;
  prospectEmail: string;
  prospectPhone?: string | null;
  companyName: string | null;
  projectName: string;
  quoteNumber: string;
  signature?: string; // Base64 image
  signedAt?: Date;
  amount?: number; // Total HT
  services?: string[]; // Custom services list
  delay?: string; // Delivery time
}

const DEFAULT_REMOTE_LOGO_URL = "https://orylis.fr/wp-content/uploads/2023/08/Frame-454507529-1.png";
const ENV_REMOTE_LOGO_URL = process.env.QUOTE_LOGO_URL ?? process.env.NEXT_PUBLIC_QUOTE_LOGO_URL ?? "";

/**
 * Génère un PDF de devis et l'upload sur Vercel Blob
 */
export async function generateQuotePDF(data: QuoteData): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Créer le document sans initialiser les polices par défaut
      // Les polices standard PDF (Helvetica, Times-Roman, Courier) sont intégrées
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Utiliser directement les polices standard PDF intégrées
      // Ces polices ne nécessitent pas de fichiers AFM externes
      doc.font("Helvetica");

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileName = `quotes/quote-${data.quoteNumber}-${Date.now()}.pdf`;

          // Vérifier que le token est configuré
          const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
          if (!blobToken) {
            throw new Error(
              "BLOB_READ_WRITE_TOKEN n'est pas défini. " +
              "Pour configurer : Vercel Dashboard → Settings → Environment Variables → Ajouter BLOB_READ_WRITE_TOKEN. " +
              "Générer le token avec : vercel blob tokens create"
            );
          }

          // Upload sur Vercel Blob
          const blob = await put(fileName, pdfBuffer, {
            access: "public",
            contentType: "application/pdf",
            token: blobToken
          });

          resolve(blob.url);
        } catch (error) {
          reject(error);
        }
      });
      doc.on("error", reject);

      // Génération du contenu du PDF (async)
      await generatePDFContent(doc, data);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generatePDFContent(doc: PDFKit.PDFDocument, data: QuoteData) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // 1) Tentative locale : logo-orylis.png dans public
  let logoPlaced = false;

  // Essayer plusieurs chemins possibles pour le fichier local
  const localPaths = [
    path.join(process.cwd(), "public", "logo-orylis.png"),
    path.join(process.cwd(), "logo-orylis.png"), // Parfois à la racine en prod
    path.resolve("./public/logo-orylis.png")
  ];

  for (const p of localPaths) {
    if (logoPlaced) break;
    try {
      const logoBuffer = await fs.readFile(p);
      doc.image(logoBuffer, margin, y, { width: 100, height: 32, fit: [100, 32] });
      y += 54;
      logoPlaced = true;
    } catch (e) {
      // Ignorer les erreurs de lecture locale, on passera au fallback
    }
  }

  // 2) Essayer l'URL publique (plus fiable que localhost en prod)
  if (!logoPlaced) {
    try {
      const publicLogoUrl = ENV_REMOTE_LOGO_URL || DEFAULT_REMOTE_LOGO_URL;
      const response = await fetch(publicLogoUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        doc.image(buffer, margin, y, { width: 100, height: 32, fit: [100, 32] });
        y += 54;
        logoPlaced = true;
      }
    } catch (error) {
      console.error("[PDF] Failed to fetch public logo:", error);
    }
  }

  // 3.5) Fallback: Fetch from current app URL (Vercel/Next.js)
  if (!logoPlaced) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    if (appUrl) {
      try {
        const logoUrl = `${appUrl}/logo-orylis.png`;
        const res = await fetch(logoUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          doc.image(buf, margin, y, { width: 100, height: 32, fit: [100, 32] });
          y += 54;
          logoPlaced = true;
        }
      } catch (e) {
        // Silently fail
      }
    }
  }

  // 4) Dernier recours: texte
  if (!logoPlaced) {
    doc
      .fontSize(28)
      .fillColor("#005eff")
      .text("Orylis", margin, y, { align: "left" });
    y += 40;
  }

  // Numéro de devis et date en haut à droite
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  doc
    .fontSize(10)
    .fillColor("#000000")
    .text(`DEVIS: ${data.quoteNumber}`, pageWidth - margin, margin, { align: "right", width: 150 })
    .text(`DATE: ${today}`, pageWidth - margin, margin + 15, { align: "right", width: 150 });

  y = 100;

  // Section CLIENT à gauche
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("CLIENT:", margin, y, { align: "left", width: contentWidth / 2 - 10 });

  y += 20;
  doc
    .fontSize(10)
    .fillColor("#333333")
    .text(`Nom : ${data.prospectName}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });

  y += 15;
  doc.text(`Email : ${data.prospectEmail}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });

  if (data.prospectPhone) {
    y += 15;
    doc.text(`Téléphone : ${data.prospectPhone}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });
  }

  if (data.companyName) {
    y += 15;
    doc.text(`Société : ${data.companyName}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });
  }

  // Section PRESTATAIRE à droite (alignée avec CLIENT) - élargie et plus à gauche pour lisibilité
  let yPrestataire = 100;
  const providerBoxWidth = 200;
  const providerBoxX = pageWidth - margin - providerBoxWidth;
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("PRESTATAIRE :", providerBoxX, yPrestataire, { align: "right", width: providerBoxWidth });

  yPrestataire += 20;
  doc
    .fontSize(10)
    .fillColor("#333333")
    .text("Nom : Orylis", providerBoxX, yPrestataire, { align: "right", width: providerBoxWidth });

  yPrestataire += 15;
  doc.text("Email : orylisfrance@gmail.com", providerBoxX, yPrestataire, { align: "right", width: providerBoxWidth });

  // Section services avec encadré
  y = Math.max(y, yPrestataire) + 50;

  // Encadré gris pour les services
  const servicesBoxY = y;
  const servicesBoxHeight = 280;
  const servicesBoxX = margin;
  const servicesBoxWidth = contentWidth;
  const servicesContentWidth = servicesBoxWidth - 30; // Padding interne

  // Fond gris clair
  doc
    .rect(servicesBoxX, servicesBoxY, servicesBoxWidth, servicesBoxHeight)
    .fillColor("#f5f5f5")
    .fill();

  // Bordure
  doc
    .rect(servicesBoxX, servicesBoxY, servicesBoxWidth, servicesBoxHeight)
    .strokeColor("#e0e0e0")
    .lineWidth(1)
    .stroke();

  // Contenu des services
  let servicesY = servicesBoxY + 20;

  // Service 1: Site internet optimisé Orylis
  const mainService = data.services && data.services.length > 0 ? data.services[0] : "Site internet optimisé Orylis";
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text(mainService, servicesBoxX + 15, servicesY, { align: "left", width: servicesContentWidth - 100 });

  // Prix du service 1 à droite
  const totalAmount = data.amount ? `${data.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` : "1 490,00 €";
  doc
    .fontSize(10)
    .fillColor("#000000")
    .text(totalAmount, servicesBoxX + servicesBoxWidth - 220, servicesY, { align: "right", width: 200 });

  servicesY += 20;

  if (data.services && data.services.length > 1) {
    // Si on a des services personnalisés
    for (let i = 1; i < data.services.length; i++) {
      doc
        .fontSize(9)
        .fillColor("#666666")
        .text(`• ${data.services[i]}`, servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });
      servicesY += 15;
    }
  } else {
    // Fallback services par défaut
    doc
      .fontSize(9)
      .fillColor("#666666")
      .text("• Branding et design sur-mesure", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

    servicesY += 15;
    doc.text("• Responsive PC, Tablette et Smartphone", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

    servicesY += 15;
    doc.text("• Référencement Google optimisé", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

    servicesY += 15;
    doc.text("• Intégration de plugin premium gratuitement", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });
    servicesY += 15;
  }

  servicesY += 30;

  // Service 2: Service de maintenance
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("Service de maintenance (offert pendant 90 jours)", servicesBoxX + 15, servicesY, { align: "left", width: servicesContentWidth - 100 });

  servicesY += 20;
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text("• Hébergement optimisé sur serveur dédié inclus (valeur 19,90 € /mois)", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

  servicesY += 15;
  doc.text("• Nom de domaine (.fr ou .com) inclus (valeur 9,90 € /an)", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

  servicesY += 15;
  doc.text("• Mise à jour, maintenance et sécurité inclus", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

  servicesY += 15;
  doc.text("• Modification site internet illimitées inclus", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

  servicesY += 15;
  doc.text("• Suivi et accompagnement pour la prise en main", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

  // Total HT à droite (label et montant séparés pour éviter le chevauchement)
  const totalY = servicesBoxY + servicesBoxHeight - 30;
  const rightEdge = servicesBoxX + servicesBoxWidth - 20;
  const amountBoxWidth = 100;
  const labelBoxWidth = 100;
  const amountX = rightEdge - amountBoxWidth;
  const labelX = amountX - labelBoxWidth - 10; // petit espacement

  doc.fontSize(12).fillColor("#000000");
  doc.text("Total HT :", labelX, totalY, { align: "right", width: labelBoxWidth });
  doc.text(totalAmount, amountX, totalY, { align: "right", width: amountBoxWidth });

  // Section paiement en bas
  y = servicesBoxY + servicesBoxHeight + 30;

  doc
    .fontSize(10)
    .fillColor("#000000")
    .text("MOYEN DE PAIEMENT :", margin, y, { align: "left", width: contentWidth / 2 });
  y += 20;
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text("Lien de paiement sécurisé", margin, y, { align: "left", width: contentWidth / 2 });

  // Supprimer l'encadré vide au-dessus de la signature (ancien placeholder QR)
  // (conservé intentionnellement vide)

  // Zone de signature client (fixe, en bas à droite)
  const signatureBoxWidth = 220;
  const signatureBoxHeight = 120;
  const signatureBoxX = pageWidth - margin - signatureBoxWidth;
  const signatureBoxY = pageHeight - margin - signatureBoxHeight - 60; // 60px au-dessus du bas

  // Fond blanc et bordure
  doc
    .rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight)
    .fillColor("#ffffff")
    .fill();
  doc
    .rect(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight)
    .strokeColor("#e0e0e0")
    .lineWidth(1)
    .stroke();

  // Label "Signature"
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text("Signature du client", signatureBoxX, signatureBoxY - 14, {
      align: "left",
      width: signatureBoxWidth
    });

  // Si signature présente, l'afficher
  if (data.signature) {
    try {
      // Nettoyer le base64 (retirer le préfixe data:image/png;base64,)
      const base64Data = data.signature.replace(/^data:image\/\w+;base64,/, "");
      const signatureBuffer = Buffer.from(base64Data, "base64");

      // Centrer la signature dans la boîte
      doc.image(signatureBuffer, signatureBoxX + 10, signatureBoxY + 10, {
        fit: [signatureBoxWidth - 20, signatureBoxHeight - 20],
        align: "center",
        valign: "center"
      });

      // Ajouter la date de signature en dessous
      if (data.signedAt) {
        const signedDate = data.signedAt.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        doc
          .fontSize(8)
          .fillColor("#005eff")
          .text(`Signé le ${signedDate}`, signatureBoxX, signatureBoxY + signatureBoxHeight + 5, {
            align: "right",
            width: signatureBoxWidth
          });
      }
    } catch (e) {
      console.error("Error embedding signature:", e);
    }
  }
}
