/**
 * Service de génération de devis PDF
 */

// Utiliser la version standalone de pdfkit qui inclut les polices standard
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type PDFKit from "pdfkit";
import { put } from "@vercel/blob";

export interface QuoteData {
  prospectName: string;
  prospectEmail: string;
  prospectPhone?: string | null;
  companyName: string | null;
  projectName: string;
  quoteNumber: string;
}

const ORYLIS_LOGO_URL = "https://orylis.fr/wp-content/uploads/2023/08/Frame-454507529-1.png";

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

  // Logo Orylis en haut à gauche
  try {
    const logoResponse = await fetch(ORYLIS_LOGO_URL);
    if (logoResponse.ok) {
      const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
      doc.image(logoBuffer, margin, y, { width: 120, height: 40, fit: [120, 40] });
      y += 50;
    } else {
      // Fallback si le logo ne charge pas
      doc
        .fontSize(28)
        .fillColor("#005eff")
        .text("Orylis", margin, y, { align: "left" });
      y += 40;
    }
  } catch (error) {
    console.error("[Quote] Failed to load logo, using text fallback:", error);
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
    .text(`Name: ${data.prospectName}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });
  
  y += 15;
  doc.text(`Email: ${data.prospectEmail}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });
  
  if (data.prospectPhone) {
    y += 15;
    doc.text(`Phone: ${data.prospectPhone}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });
  }
  
  if (data.companyName) {
    y += 15;
    doc.text(`Company: ${data.companyName}`, margin, y, { align: "left", width: contentWidth / 2 - 10 });
  }

  // Section PRESTATAIRE à droite (alignée avec CLIENT)
  let yPrestataire = 100;
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("PRESTATAIRE :", pageWidth - margin, yPrestataire, { align: "right", width: contentWidth / 2 - 10 });
  
  yPrestataire += 20;
  doc
    .fontSize(10)
    .fillColor("#333333")
    .text("Name: Orylis", pageWidth - margin, yPrestataire, { align: "right", width: contentWidth / 2 - 10 });
  
  yPrestataire += 15;
  doc.text("Email: orylisfrance@gmail.com", pageWidth - margin, yPrestataire, { align: "right", width: contentWidth / 2 - 10 });

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
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("Site internet optimisé Orylis", servicesBoxX + 15, servicesY, { align: "left", width: servicesContentWidth - 100 });
  
  // Prix du service 1 à droite (site internet)
  doc
    .fontSize(10)
    .fillColor("#000000")
    .text("1 490,00 €", servicesBoxX + servicesBoxWidth - 20, servicesY, { align: "right", width: 100 });
  
  servicesY += 20;
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text("• Branding et design sur-mesure", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });
  
  servicesY += 15;
  doc.text("• Responsive PC, Tablette et Smartphone", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });
  
  servicesY += 15;
  doc.text("• Référencement Google optimisé", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });
  
  servicesY += 15;
  doc.text("• Intégration de plugin premium gratuitement (valeur 290,90 € /an)", servicesBoxX + 20, servicesY, { align: "left", width: servicesContentWidth });

  servicesY += 30;

  // Service 2: Service de maintenance
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("Service de maintenance", servicesBoxX + 15, servicesY, { align: "left", width: servicesContentWidth - 100 });
  
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

  // Total HT à droite
  const totalY = servicesBoxY + servicesBoxHeight - 30;
  doc
    .fontSize(12)
    .fillColor("#000000")
    .text("Total HT :", servicesBoxX + servicesBoxWidth - 100, totalY, { align: "right", width: 80 })
    .text("1 490,00 €", servicesBoxX + servicesBoxWidth - 20, totalY, { align: "right", width: 100 });

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
  
  // Encadré pour QR code ou détails paiement (optionnel)
  const paymentBoxY = y - 5;
  const paymentBoxHeight = 60;
  const paymentBoxWidth = 200;
  
  doc
    .rect(pageWidth - margin - paymentBoxWidth, paymentBoxY, paymentBoxWidth, paymentBoxHeight)
    .strokeColor("#e0e0e0")
    .lineWidth(1)
    .stroke();

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
}

