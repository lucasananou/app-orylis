import { db } from "@/lib/db";
import { projects, quotes, onboardingResponses, profiles, authUsers } from "@/lib/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { sendOnboardingReminderEmail, sendQuoteReadyEmail, sendQuoteReminderEmail, sendInternalInactivityNotification } from "./emails";

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
      id: projects.id,
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
        sql`${projects.progress} < 100`
      )
    );

  // Onboarding incomplets depuis plus de 48h avec progression < 100%
  const projects48h = await db
    .select({
      id: projects.id,
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

  // Onboarding incomplets depuis 7 jours (une seule fois)
  const sevenDaysAgoStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const projects7days = await db
    .select({
      id: projects.id,
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
        sql`${projects.createdAt} > ${sevenDaysAgoStart}`,
        sql`${projects.createdAt} < ${sevenDaysAgoEnd}`,
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
        await sendOnboardingReminderEmail(project.ownerId, project.projectName, project.projectId, "24h");
        results.push({ type: "onboarding_24h", projectId: project.projectId, success: true });
      } catch (error) {
        console.error(`Error sending 24h reminder for project ${project.projectId}:`, error);
        results.push({ type: "onboarding_24h", projectId: project.projectId, success: false });
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
        await sendOnboardingReminderEmail(project.ownerId, project.projectName, project.projectId, "48h");
        results.push({ type: "onboarding_48h", projectId: project.projectId, success: true });
      } catch (error) {
        console.error(`Error sending 48h reminder for project ${project.projectId}:`, error);
        results.push({ type: "onboarding_48h", projectId: project.projectId, success: false });
      }
    }
  }

  // Envoyer les rappels 7 jours + Notification interne
  for (const project of projects7days) {
    const user = await db.query.authUsers.findFirst({
      where: eq(authUsers.id, project.ownerId),
      columns: { email: true, name: true }
    });

    if (user?.email) {
      try {
        // Relance client
        await sendOnboardingReminderEmail(project.ownerId, project.projectName, project.projectId, "7days");
        results.push({ type: "onboarding_7days", projectId: project.projectId, success: true });

        // Notification interne
        await sendInternalInactivityNotification(
          user.name ?? user.email,
          project.projectName,
          "onboarding_incomplete"
        );
      } catch (error) {
        console.error(`Error sending 7days reminder for project ${project.projectId}:`, error);
        results.push({ type: "onboarding_7days", projectId: project.projectId, success: false });
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
/**
 * Envoie des rappels pour les devis non signés après 3 jours et 7 jours
 */
export async function checkAndSendQuoteReminders() {
  const now = new Date();

  // Fenêtre pour J+3 (entre 3 et 4 jours)
  const threeDaysAgoStart = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const threeDaysAgoEnd = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Fenêtre pour J+7 (entre 7 et 8 jours)
  const sevenDaysAgoStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Devis J+3
  const quotes3Days = await db
    .select({
      quoteId: quotes.id,
      projectId: quotes.projectId,
      createdAt: quotes.createdAt
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.status, "pending"),
        sql`${quotes.createdAt} > ${threeDaysAgoStart}`,
        sql`${quotes.createdAt} < ${threeDaysAgoEnd}`
      )
    );

  // Devis J+7
  const quotes7Days = await db
    .select({
      quoteId: quotes.id,
      projectId: quotes.projectId,
      createdAt: quotes.createdAt
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.status, "pending"),
        sql`${quotes.createdAt} > ${sevenDaysAgoStart}`,
        sql`${quotes.createdAt} < ${sevenDaysAgoEnd}`
      )
    );

  const results = [];

  // Traitement J+3
  for (const quote of quotes3Days) {
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
          await sendQuoteReminderEmail(project.ownerId, project.name, quote.quoteId, "3days");
          results.push({ type: "quote_reminder_3d", quoteId: quote.quoteId, success: true });
        } catch (error) {
          console.error(`Error sending 3-day quote reminder for quote ${quote.quoteId}:`, error);
          results.push({ type: "quote_reminder_3d", quoteId: quote.quoteId, success: false });
        }
      }
    }
  }

  // Traitement J+7 + Notification interne
  for (const quote of quotes7Days) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, quote.projectId),
      columns: { ownerId: true, name: true }
    });

    if (project) {
      const user = await db.query.authUsers.findFirst({
        where: eq(authUsers.id, project.ownerId),
        columns: { email: true, name: true }
      });

      if (user?.email) {
        try {
          // Relance client
          await sendQuoteReminderEmail(project.ownerId, project.name, quote.quoteId, "7days");
          results.push({ type: "quote_reminder_7d", quoteId: quote.quoteId, success: true });

          // Notification interne
          await sendInternalInactivityNotification(
            user.name ?? user.email,
            project.name,
            "quote_pending"
          );
        } catch (error) {
          console.error(`Error sending 7-day quote reminder for quote ${quote.quoteId}:`, error);
          results.push({ type: "quote_reminder_7d", quoteId: quote.quoteId, success: false });
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

