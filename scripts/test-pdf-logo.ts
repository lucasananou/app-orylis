
import PDFDocument from "pdfkit";
import fs from "node:fs/promises";
import { appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const LOG_FILE = path.join(process.cwd(), "debug-log.txt");
try {
    writeFileSync(LOG_FILE, ""); // Clear log file
} catch (e) {
    console.error("Failed to clear log file", e);
}

function log(message: string, ...args: any[]) {
    try {
        const msg = `[${new Date().toISOString()}] ${message} ${args.map(a => {
            try { return JSON.stringify(a); } catch { return String(a); }
        }).join(" ")}\n`;
        console.log(message, ...args);
        appendFileSync(LOG_FILE, msg);
    } catch (e) {
        console.error("Logging failed:", e);
    }
}

// Mock QuoteData
interface QuoteData {
    prospectName: string;
    prospectEmail: string;
    prospectPhone?: string | null;
    companyName: string | null;
    projectName: string;
    quoteNumber: string;
    signature?: string;
    signedAt?: Date;
}

const mockData: QuoteData = {
    prospectName: "Jean Dupont",
    prospectEmail: "jean.dupont@example.com",
    companyName: "Dupont SARL",
    projectName: "Site Vitrine",
    quoteNumber: "001",
};

async function generatePDFContent(doc: PDFKit.PDFDocument, data: QuoteData) {
    const margin = 50;
    let y = margin;

    // 1) Tentative locale : logo-orylis.png dans public
    let logoPlaced = false;

    // Essayer plusieurs chemins possibles pour le fichier local
    const localPaths = [
        path.join(process.cwd(), "public", "logo-orylis.png"),
        path.join(process.cwd(), "logo-orylis.png"),
        path.resolve("./public/logo-orylis.png")
    ];

    log("[Test] Checking local paths:", localPaths);

    for (const p of localPaths) {
        if (logoPlaced) break;
        try {
            log(`[Test] Trying to read file: ${p}`);
            const logoBuffer = await fs.readFile(p);
            log(`[Test] File read successfully. Size: ${logoBuffer.length} bytes`);
            doc.image(logoBuffer, margin, y, { width: 140, height: 44, fit: [140, 44] });
            y += 54;
            logoPlaced = true;
            log("Logo loaded from:", p);
        } catch (e: any) {
            log(`[PDF] Failed to load local logo from ${p}:`, e.message);
        }
    }

    // 2) Essayer l'URL publique
    if (!logoPlaced) {
        try {
            const publicLogoUrl = "https://orylis.fr/wp-content/uploads/2023/08/Frame-454507529-1.png";
            log(`[PDF] Trying public logo URL: ${publicLogoUrl}`);
            const response = await fetch(publicLogoUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                log(`[PDF] Public logo fetched successfully. Size: ${buffer.length} bytes`);
                doc.image(buffer, margin, y, { width: 140, height: 44, fit: [140, 44] });
                y += 54;
                logoPlaced = true;
            } else {
                log(`[PDF] Public logo fetch failed with status: ${response.status} ${response.statusText}`);
            }
        } catch (error: any) {
            log("[PDF] Failed to fetch public logo:", error.message);
        }
    }

    // 4) Dernier recours: texte
    if (!logoPlaced) {
        log("[Test] Fallback to text logo");
        doc
            .fontSize(28)
            .fillColor("#005eff")
            .text("Orylis", margin, y, { align: "left" });
        y += 40;
    }

    doc.text("Test PDF Generation Complete", margin, y + 50);
}

async function run() {
    log("Starting PDF generation test...");
    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Pipe to file
    const outputPath = path.join(process.cwd(), "test-quote.pdf");

    // Dynamic import for fs stream
    const { createWriteStream } = await import("node:fs");
    doc.pipe(createWriteStream(outputPath));

    doc.font("Helvetica");

    await generatePDFContent(doc, mockData);

    doc.end();
    log(`PDF generated at: ${outputPath}`);
}

run().catch((e) => log("FATAL ERROR:", e));
