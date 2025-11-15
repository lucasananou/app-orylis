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
  return new Promise((resolve, reject) => {
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

    // Génération du contenu du PDF
    generatePDFContent(doc, data);
    doc.end();
  });
}

function generatePDFContent(doc: PDFKit.PDFDocument, data: QuoteData) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;
  let y = margin;

  // Logo Orylis en haut à gauche
  doc
    .fontSize(28)
    .fillColor("#005eff")
    .text("Orylis", margin, y, { align: "left" });
  
  // Numéro de devis et date en haut à droite
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  doc
    .fontSize(10)
    .fillColor("#000000")
    .text(`DEVIS: ${data.quoteNumber}`, pageWidth - margin, y, { align: "right" })
    .text(`DATE: ${today}`, pageWidth - margin, y + 15, { align: "right" });

  y = 100;

  // Section CLIENT à gauche
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("CLIENT:", margin, y, { align: "left" });
  
  y += 20;
  doc
    .fontSize(10)
    .fillColor("#333333")
    .text(`Name: ${data.prospectName}`, margin, y, { align: "left" });
  
  y += 15;
  doc.text(`Email: ${data.prospectEmail}`, margin, y, { align: "left" });
  
  if (data.prospectPhone) {
    y += 15;
    doc.text(`Phone: ${data.prospectPhone}`, margin, y, { align: "left" });
  }
  
  if (data.companyName) {
    y += 15;
    doc.text(`Company: ${data.companyName}`, margin, y, { align: "left" });
  }

  // Section PRESTATAIRE à droite
  let yPrestataire = 100;
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("PRESTATAIRE :", pageWidth - margin, yPrestataire, { align: "right" });
  
  yPrestataire += 20;
  doc
    .fontSize(10)
    .fillColor("#333333")
    .text("Name: Orylis", pageWidth - margin, yPrestataire, { align: "right" });
  
  yPrestataire += 15;
  doc.text("Email: orylisfrance@gmail.com", pageWidth - margin, yPrestataire, { align: "right" });

  // Section services avec encadré
  y = Math.max(y, yPrestataire) + 50;
  
  // Encadré gris pour les services
  const servicesBoxY = y;
  const servicesBoxHeight = 280;
  const servicesBoxX = margin;
  const servicesBoxWidth = pageWidth - (margin * 2);
  
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
    .text("Site internet optimisé Orylis", servicesBoxX + 15, servicesY, { align: "left" });
  
  servicesY += 20;
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text("• Branding et design sur-mesure", servicesBoxX + 20, servicesY, { align: "left" });
  
  servicesY += 15;
  doc.text("• Responsive PC, Tablette et Smartphone", servicesBoxX + 20, servicesY, { align: "left" });
  
  servicesY += 15;
  doc.text("• Référencement Google optimisé", servicesBoxX + 20, servicesY, { align: "left" });
  
  servicesY += 15;
  doc.text("• Intégration de plugin premium gratuitement (valeur 290,90 € /an)", servicesBoxX + 20, servicesY, { align: "left" });
  
  // Prix du service 1 à droite (site internet)
  doc
    .fontSize(10)
    .fillColor("#000000")
    .text("1 490,00 €", servicesBoxX + servicesBoxWidth - 20, servicesBoxY + 20, { align: "right" });

  servicesY += 30;

  // Service 2: Service de maintenance
  doc
    .fontSize(11)
    .fillColor("#000000")
    .text("Service de maintenance", servicesBoxX + 15, servicesY, { align: "left" });
  
  servicesY += 20;
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text("• Hébergement optimisé sur serveur dédié inclus (valeur 19,90 € /mois)", servicesBoxX + 20, servicesY, { align: "left" });
  
  servicesY += 15;
  doc.text("• Nom de domaine (.fr ou .com) inclus (valeur 9,90 € /an)", servicesBoxX + 20, servicesY, { align: "left" });
  
  servicesY += 15;
  doc.text("• Mise à jour, maintenance et sécurité inclus", servicesBoxX + 20, servicesY, { align: "left" });
  
  servicesY += 15;
  doc.text("• Modification site internet illimitées inclus", servicesBoxX + 20, servicesY, { align: "left" });
  
  servicesY += 15;
  doc.text("• Suivi et accompagnement pour la prise en main", servicesBoxX + 20, servicesY, { align: "left" });

  // Total HT à droite
  const totalY = servicesBoxY + servicesBoxHeight - 30;
  doc
    .fontSize(12)
    .fillColor("#000000")
    .text("Total HT :", servicesBoxX + servicesBoxWidth - 100, totalY, { align: "right" })
    .text("1 490,00 €", servicesBoxX + servicesBoxWidth - 20, totalY, { align: "right" });

  // Section paiement en bas
  y = servicesBoxY + servicesBoxHeight + 30;
  
  doc
    .fontSize(10)
    .fillColor("#000000")
    .text("MOYEN DE PAIEMENT :", margin, y, { align: "left" });
  
  y += 20;
  doc
    .fontSize(9)
    .fillColor("#666666")
    .text("Lien de paiement sécurisé", margin, y, { align: "left" });
  
  // Encadré pour QR code ou détails paiement (optionnel)
  const paymentBoxY = y - 5;
  const paymentBoxHeight = 60;
  const paymentBoxWidth = 200;
  
  doc
    .rect(pageWidth - margin - paymentBoxWidth, paymentBoxY, paymentBoxWidth, paymentBoxHeight)
    .strokeColor("#e0e0e0")
    .lineWidth(1)
    .stroke();
}

