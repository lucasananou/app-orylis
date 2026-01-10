import { config } from "dotenv";
config({ path: ".env.local" });

console.log("🔍 Vérification de la configuration Google Analytics\n");

// 1. Vérifier les variables d'environnement
const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;

console.log("✅ Variables d'environnement:");
console.log(`  GOOGLE_SERVICE_ACCOUNT_EMAIL: ${serviceEmail ? "✓ Défini" : "✗ Manquant"}`);
if (serviceEmail) {
    console.log(`    → ${serviceEmail}`);
}
console.log(`  GOOGLE_PRIVATE_KEY: ${privateKey ? "✓ Défini" : "✗ Manquant"}`);

if (!serviceEmail || !privateKey) {
    console.error("\n❌ Configuration incomplète. Vérifiez votre .env.local");
    process.exit(1);
}

// 2. Vérifier le format de la clé privée
console.log("\n🔑 Format de la clé privée:");
console.log(`  Commence par '-----BEGIN': ${privateKey.startsWith("-----BEGIN") ? "✓" : "✗"}`);
console.log(`  Termine par '-----END': ${privateKey.trim().endsWith("-----") ? "✓" : "✗"}`);
console.log(`  Contient des \\n: ${privateKey.includes("\\n") ? "✓" : "✗"}`);
console.log(`  Longueur: ${privateKey.length} caractères`);
console.log(`  Premiers 50 caractères: ${privateKey.substring(0, 50)}...`);

// 3. Essayer de créer un client Google Analytics
console.log("\n🔧 Tentative de création du client Google Analytics...");
try {
    const { BetaAnalyticsDataClient } = require("@google-analytics/data");

    const fixedPrivateKey = privateKey.replace(/\\n/g, '\n');

    console.log(`  Clé après remplacement (premiers 50 char): ${fixedPrivateKey.substring(0, 50)}...`);
    console.log(`  Contient des vrais retours à ligne après fix: ${fixedPrivateKey.includes("\n") ? "✓" : "✗"}`);

    const credentials = {
        client_email: serviceEmail,
        private_key: fixedPrivateKey,
    };

    const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials
    });

    console.log("\n✅ Client Google Analytics créé avec succès!");
    console.log("\n📝 Prochaines étapes:");
    console.log("  1. Vérifiez qu'un projet a un googlePropertyId configuré");
    console.log("  2. Donnez accès 'Viewer' au Service Account sur la propriété GA4");
    console.log("  3. Testez l'endpoint: /api/projects/[id]/analytics");

} catch (error: any) {
    console.error("\n❌ Erreur lors de la création du client:");
    console.error("Message:", error.message);
    if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
    }
    console.log("\n💡 Solution:");
    console.log("  Vérifiez que GOOGLE_PRIVATE_KEY contient des retours à ligne \\n");
    console.log("  Format: \"-----BEGIN PRIVATE KEY-----\\nVOTRE_CLE\\n-----END PRIVATE KEY-----\"");
    process.exit(1);
}

console.log("\n✅ Tous les tests sont passés !");
process.exit(0);
