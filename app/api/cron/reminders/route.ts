import { NextResponse } from "next/server";
import { processAllReminders } from "@/lib/email-reminders";

/**
 * Route API pour les rappels automatiques
 * À appeler via un cron job (Vercel Cron ou Make.com)
 * 
 * Exemple de configuration Vercel Cron (vercel.json) :
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "0 9 * * *" // Tous les jours à 9h
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Vérifier l'authentification (optionnel : ajouter un secret)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processAllReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        onboarding: {
          sent: results.onboarding.filter((r) => r.success).length,
          failed: results.onboarding.filter((r) => !r.success).length,
          total: results.onboarding.length
        },
        quoteReady: {
          sent: results.quoteReady.filter((r) => r.success).length,
          failed: results.quoteReady.filter((r) => !r.success).length,
          total: results.quoteReady.length
        },
        quoteReminder: {
          sent: results.quoteReminder.filter((r) => r.success).length,
          failed: results.quoteReminder.filter((r) => !r.success).length,
          total: results.quoteReminder.length
        }
      }
    });
  } catch (error) {
    console.error("[Cron Reminders] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

