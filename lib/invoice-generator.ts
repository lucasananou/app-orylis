import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { put } from "@vercel/blob";

interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    clientName: string;
    clientAddress?: string;
    projectName: string;
    description: string;
    amount: number; // En euros
    type: "deposit" | "balance" | "standard";
}

export async function generateInvoicePdf(data: InvoiceData): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 format
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 10;
    const margin = 50;

    // --- Header ---
    // Logo (Placeholder text for now, ideally embed an image)
    page.drawText("ORYLIS", {
        x: margin,
        y: height - margin,
        size: 20,
        font: boldFont,
        color: rgb(0.12, 0.4, 1), // Blue
    });

    page.drawText("Agence Web & Digitale", {
        x: margin,
        y: height - margin - 15,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
    });

    // Company Info (Right side)
    const companyInfo = [
        "Orylis",
        "123 Avenue des Champs-Élysées",
        "75008 Paris",
        "SIRET: 123 456 789 00000",
        "contact@orylis.fr",
        "www.orylis.fr"
    ];

    let yPos = height - margin;
    companyInfo.forEach(line => {
        const textWidth = font.widthOfTextAtSize(line, 9);
        page.drawText(line, {
            x: width - margin - textWidth,
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 12;
    });

    // --- Invoice Title & Details ---
    yPos = height - 150;

    const title = data.type === "deposit" ? "FACTURE D'ACOMPTE" : "FACTURE";
    page.drawText(`${title} N° ${data.invoiceNumber}`, {
        x: margin,
        y: yPos,
        size: 16,
        font: boldFont,
    });

    yPos -= 20;
    page.drawText(`Date : ${data.date.toLocaleDateString("fr-FR")}`, {
        x: margin,
        y: yPos,
        size: 10,
        font: font,
    });

    // --- Client Info ---
    yPos -= 40;
    page.drawText("Facturé à :", {
        x: margin,
        y: yPos,
        size: 10,
        font: boldFont,
    });

    yPos -= 15;
    page.drawText(data.clientName, {
        x: margin,
        y: yPos,
        size: 10,
        font: font,
    });

    if (data.clientAddress) {
        yPos -= 15;
        page.drawText(data.clientAddress, {
            x: margin,
            y: yPos,
            size: 10,
            font: font,
        });
    }

    // --- Table Header ---
    yPos = height - 300;
    const tableTop = yPos;

    // Background for header
    page.drawRectangle({
        x: margin,
        y: yPos - 5,
        width: width - 2 * margin,
        height: 20,
        color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("Description", { x: margin + 10, y: yPos, size: 10, font: boldFont });
    page.drawText("Montant HT", { x: width - margin - 150, y: yPos, size: 10, font: boldFont });
    page.drawText("TVA (0%)", { x: width - margin - 80, y: yPos, size: 10, font: boldFont }); // Auto-entrepreneur ? A adapter
    page.drawText("Total TTC", { x: width - margin - 30, y: yPos, size: 10, font: boldFont, opacity: 0 }); // Just for alignment logic if needed

    // --- Table Content ---
    yPos -= 30;
    page.drawText(data.description, {
        x: margin + 10,
        y: yPos,
        size: 10,
        font: font,
    });

    page.drawText(`${data.amount.toFixed(2)} €`, {
        x: width - margin - 150,
        y: yPos,
        size: 10,
        font: font,
    });

    page.drawText("-", {
        x: width - margin - 80,
        y: yPos,
        size: 10,
        font: font,
    });

    // --- Totals ---
    yPos -= 50;
    const totalX = width - margin - 150;

    page.drawLine({
        start: { x: totalX - 20, y: yPos + 10 },
        end: { x: width - margin, y: yPos + 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Total HT :", { x: totalX, y: yPos, size: 10, font: font });
    const totalHtText = `${data.amount.toFixed(2)} €`;
    const totalHtWidth = font.widthOfTextAtSize(totalHtText, 10);
    page.drawText(totalHtText, { x: width - margin - totalHtWidth, y: yPos, size: 10, font: font });

    yPos -= 20;
    page.drawText("Total TTC :", { x: totalX, y: yPos, size: 12, font: boldFont });
    page.drawText(`${data.amount.toFixed(2)} €`, { x: width - margin - 50, y: yPos, size: 12, font: boldFont });

    // --- Footer / Legal ---
    const bottomY = 50;
    page.drawText("TVA non applicable, art. 293 B du CGI", {
        x: margin,
        y: bottomY + 20,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
    });

    if (data.type === "deposit") {
        page.drawText("Note : Ceci est une facture d'acompte. Le solde sera facturé à la livraison du projet.", {
            x: margin,
            y: bottomY,
            size: 9,
            font: font,
            color: rgb(0.2, 0.2, 0.2),
        });
    }

    const pdfBytes = await pdfDoc.save();

    // Upload to Blob
    const fileName = `invoices/${data.invoiceNumber}.pdf`;
    const blob = await put(fileName, Buffer.from(pdfBytes), {
        access: "public",
        contentType: "application/pdf",
        token: process.env.BLOB_READ_WRITE_TOKEN!
    });

    return blob.url;
}
