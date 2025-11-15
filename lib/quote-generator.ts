/**
 * Service de génération de devis PDF
 */

import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";
import { put } from "@vercel/blob";

export interface QuoteData {
  prospectName: string;
  prospectEmail: string;
  companyName: string | null;
  projectName: string;
  quoteNumber: string;
}

const ORYLIS_LOGO_URL = "https://orylis.fr/wp-content/uploads/2023/08/Frame-454507529-1.png";

// Fonction helper pour convertir hex en RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 94, b: 255 };
}

/**
 * Génère un PDF de devis et l'upload sur Vercel Blob
 */
export async function generateQuotePDF(data: QuoteData): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const fileName = `quotes/quote-${data.quoteNumber}-${Date.now()}.pdf`;

        // Vérifier que le token est configuré
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        if (!blobToken) {
          throw new Error("BLOB_READ_WRITE_TOKEN n'est pas défini");
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

    // Génération du contenu du PDF
    generatePDFContent(doc, data);
    doc.end();
  });
}

function generatePDFContent(doc: PDFKit.PDFDocument, data: QuoteData) {
  const orylisColor = hexToRgb("#005eff");
  const grayColor = hexToRgb("#666666");
  const darkGrayColor = hexToRgb("#333333");
  const lightGrayColor = hexToRgb("#999999");

  // Header avec logo (placeholder pour le logo)
  doc
    .fontSize(24)
    .fillColor(orylisColor.r / 255, orylisColor.g / 255, orylisColor.b / 255)
    .text("Orylis", 50, 50, { align: "left" })
    .fontSize(10)
    .fillColor(grayColor.r / 255, grayColor.g / 255, grayColor.b / 255)
    .text("Création de sites internet professionnels", 50, 75, { align: "left" });

  // Informations du prospect
  doc
    .fontSize(12)
    .fillColor(0, 0, 0)
    .moveDown(2)
    .text(data.prospectName, { align: "left" })
    .text(data.prospectEmail, { align: "left" });
  
  if (data.companyName) {
    doc.text(data.companyName, { align: "left" });
  }

  // Titre du devis
  doc
    .moveDown(1)
    .fontSize(20)
    .fillColor(orylisColor.r / 255, orylisColor.g / 255, orylisColor.b / 255)
    .text("Devis – Création de site internet", { align: "center" })
    .fontSize(10)
    .fillColor(grayColor.r / 255, grayColor.g / 255, grayColor.b / 255)
    .text(`Devis n° ${data.quoteNumber}`, { align: "center" })
    .moveDown(1);

  // Services inclus
  doc
    .fontSize(14)
    .fillColor(0, 0, 0)
    .text("Services inclus :", { underline: true })
    .moveDown(0.5);

  doc.fontSize(11).fillColor(darkGrayColor.r / 255, darkGrayColor.g / 255, darkGrayColor.b / 255);

  // Site internet optimisé Orylis
  doc.text("Site internet optimisé Orylis", { continued: false });
  doc.fontSize(10).fillColor(grayColor.r / 255, grayColor.g / 255, grayColor.b / 255);
  doc.text("• Branding et design sur-mesure", { indent: 20 });
  doc.text("• Responsive PC, Tablette et Smartphone", { indent: 20 });
  doc.text("• Référencement Google optimisé", { indent: 20 });
  doc.text("• Intégration de plugin premium gratuitement (valeur 290,90 € /an)", { indent: 20 });

  doc.moveDown(0.5).fontSize(11).fillColor(darkGrayColor.r / 255, darkGrayColor.g / 255, darkGrayColor.b / 255);
  doc.text("Service de maintenance", { continued: false });
  doc.fontSize(10).fillColor(grayColor.r / 255, grayColor.g / 255, grayColor.b / 255);
  doc.text("• Hébergement optimisé sur serveur dédié inclus (valeur 19,90 € /mois)", { indent: 20 });
  doc.text("• Nom de domaine (.fr ou .com) inclus (valeur 9,90 € /an)", { indent: 20 });
  doc.text("• Mise à jour, maintenance et sécurité inclus", { indent: 20 });
  doc.text("• Modification site internet illimitées inclus", { indent: 20 });
  doc.text("• Suivi et accompagnement pour la prise en main", { indent: 20 });

  // Prix
  doc
    .moveDown(1.5)
    .fontSize(16)
    .fillColor(0, 0, 0)
    .text("Prix : 1 490 € HT", { align: "right", underline: true })
    .moveDown(0.5)
    .fontSize(10)
    .fillColor(grayColor.r / 255, grayColor.g / 255, grayColor.b / 255)
    .text("Acompte : 500 €", { align: "right" })
    .text("Délais : 7 jours", { align: "right" });

  // Conditions
  doc
    .moveDown(1.5)
    .fontSize(11)
    .fillColor(darkGrayColor.r / 255, darkGrayColor.g / 255, darkGrayColor.b / 255)
    .text("Conditions :", { underline: true })
    .moveDown(0.5)
    .fontSize(10)
    .fillColor(grayColor.r / 255, grayColor.g / 255, grayColor.b / 255)
    .text("• Paiement 3× possible", { indent: 20 })
    .text("• Support inclus pendant 90 jours", { indent: 20 });

  // Footer
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;
  const footerY = pageHeight - 50;

  doc
    .fontSize(8)
    .fillColor(lightGrayColor.r / 255, lightGrayColor.g / 255, lightGrayColor.b / 255)
    .text(
      "Orylis - Création de sites internet professionnels",
      pageWidth / 2,
      footerY,
      { align: "center" }
    )
    .text(
      `Devis généré le ${new Date().toLocaleDateString("fr-FR")}`,
      pageWidth / 2,
      footerY + 15,
      { align: "center" }
    );
}

