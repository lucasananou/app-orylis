import { db } from "@/lib/db";
import { projects, quotes, onboardingResponses, profiles, authUsers } from "@/lib/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { sendOnboardingReminderEmail, sendQuoteReadyEmail, sendQuoteReminderEmail } from "./emails";

/**
 * Envoie des rappels pour les onboarding incomplets
 * - Après 24h si onboarding < 50%
 * - Après 48h si onboarding < 100%
 */
export async function checkAndSendOnboardingReminders() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Onboarding incomplets depuis plus de 24h avec progression < 50%
  const projects24h = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      ownerId: projects.ownerId,
      progress: projects.progress,
      createdAt: projects.createdAt
    })
    .from(projects)
    .where(
      and(
        eq(projects.status, "onboarding"),
        lt(projects.createdAt, yesterday),
        sql`${projects.progress} < 50`
      )
    );

  // Onboarding incomplets depuis plus de 48h avec progression < 100%
  const projects48h = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      ownerId: projects.ownerId,
      progress: projects.progress,
      createdAt: projects.createdAt
    })
    .from(projects)
    .where(
      and(
        eq(projects.status, "onboarding"),
        lt(projects.createdAt, twoDaysAgo),
        sql`${projects.progress} < 100`
      )
    );

  const results = [];

  // Envoyer les rappels 24h
  for (const project of projects24h) {
    const user = await db.query.authUsers.findFirst({
      where: eq(authUsers.id, project.ownerId),
      columns: { email: true }
    });

    if (user?.email) {
      try {
        await sendOnboardingReminderEmail(project.ownerId, project.projectName, project.id, "24h");
        results.push({ type: "onboarding_24h", projectId: project.id, success: true });
      } catch (error) {
        console.error(`Error sending 24h reminder for project ${project.id}:`, error);
        results.push({ type: "onboarding_24h", projectId: project.id, success: false });
      }
    }
  }

  // Envoyer les rappels 48h
  for (const project of projects48h) {
    const user = await db.query.authUsers.findFirst({
      where: eq(authUsers.id, project.ownerId),
      columns: { email: true }
    });

    if (user?.email) {
      try {
        await sendOnboardingReminderEmail(project.ownerId, project.projectName, project.id, "48h");
        results.push({ type: "onboarding_48h", projectId: project.id, success: true });
      } catch (error) {
        console.error(`Error sending 48h reminder for project ${project.id}:`, error);
        results.push({ type: "onboarding_48h", projectId: project.id, success: false });
      }
    }
  }

  return results;
}

/**
 * Envoie des notifications pour les devis prêts à être signés
 * Vérifie les devis créés il y a moins de 24h et non signés
 */
export async function checkAndSendQuoteReadyNotifications() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Devis créés il y a entre 1h et 24h, non signés
  const readyQuotes = await db
    .select({
      quoteId: quotes.id,
      projectId: quotes.projectId,
      createdAt: quotes.createdAt
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.status, "pending"),
        sql`${quotes.createdAt} > ${oneDayAgo}`,
        sql`${quotes.createdAt} < ${oneHourAgo}`
      )
    );

  const results = [];

  for (const quote of readyQuotes) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, quote.projectId),
      columns: { ownerId: true, name: true }
    });

    if (project) {
      const user = await db.query.authUsers.findFirst({
        where: eq(authUsers.id, project.ownerId),
        columns: { email: true }
      });

      if (user?.email) {
        try {
          await sendQuoteReadyEmail(project.ownerId, project.name, quote.quoteId);
          results.push({ type: "quote_ready", quoteId: quote.quoteId, success: true });
        } catch (error) {
          console.error(`Error sending quote ready notification for quote ${quote.quoteId}:`, error);
          results.push({ type: "quote_ready", quoteId: quote.quoteId, success: false });
        }
      }
    }
  }

  return results;
}

/**
 * Envoie des rappels pour les devis non signés après 3 jours
 */
export async function checkAndSendQuoteReminders() {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Devis créés il y a plus de 3 jours et non signés
  const pendingQuotes = await db
    .select({
      quoteId: quotes.id,
      projectId: quotes.projectId,
      createdAt: quotes.createdAt
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.status, "pending"),
        sql`${quotes.createdAt} < ${threeDaysAgo}`
      )
    );

  const results = [];

  for (const quote of pendingQuotes) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, quote.projectId),
      columns: { ownerId: true, name: true }
    });

    if (project) {
      const user = await db.query.authUsers.findFirst({
        where: eq(authUsers.id, project.ownerId),
        columns: { email: true }
      });

      if (user?.email) {
        try {
          await sendQuoteReminderEmail(project.ownerId, project.name, quote.quoteId);
          results.push({ type: "quote_reminder", quoteId: quote.quoteId, success: true });
        } catch (error) {
          console.error(`Error sending quote reminder for quote ${quote.quoteId}:`, error);
          results.push({ type: "quote_reminder", quoteId: quote.quoteId, success: false });
        }
      }
    }
  }

  return results;
}

/**
 * Fonction principale pour vérifier et envoyer tous les rappels
 */
export async function processAllReminders() {
  const results = {
    onboarding: await checkAndSendOnboardingReminders(),
    quoteReady: await checkAndSendQuoteReadyNotifications(),
    quoteReminder: await checkAndSendQuoteReminders()
  };

  return results;
}

