import { and, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  notifications,
  notificationPreferences,
  profiles,
  projects,
  notificationTypeEnum
} from "@/lib/schema";
import type { UserRole } from "@/lib/utils";

export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

export interface CreateNotificationParams {
  userId: string;
  projectId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
}

export interface ListNotificationsParams {
  userId: string;
  status?: "all" | "unread";
  limit?: number;
}

export interface MarkNotificationsParams {
  userId: string;
  ids?: string[];
  markAll?: boolean;
}

type NotificationPreference = typeof notificationPreferences.$inferSelect;

const preferenceFieldByType: Record<NotificationType, keyof NotificationPreference | null> = {
  ticket_created: "ticketUpdates",
  ticket_updated: "ticketUpdates",
  file_uploaded: "fileUpdates",
  billing_added: "billingUpdates",
  onboarding_update: "onboardingUpdates",
  system: null
};

function isMissingNotificationsTable(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01"
  );
}

async function runSafeNotificationOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isMissingNotificationsTable(error)) {
      console.warn("[Notifications] Table missing, skipping operation.");
      return fallback;
    }
    throw error;
  }
}

async function ensurePreferences(userId: string) {
  return runSafeNotificationOperation(async () => {
    const existing = await db.query.notificationPreferences.findFirst({
      where: (prefs, { eq }) => eq(prefs.userId, userId)
    });

    if (existing) {
      return existing;
    }

    await db.insert(notificationPreferences).values({ userId }).onConflictDoNothing();

    return db.query.notificationPreferences.findFirst({
      where: (prefs, { eq }) => eq(prefs.userId, userId)
    });
  }, null);
}

async function shouldDeliverNotification(userId: string, type: NotificationType): Promise<boolean> {
  const preferenceField = preferenceFieldByType[type];
  if (!preferenceField) {
    return true;
  }

  const preferences = await ensurePreferences(userId);
  if (!preferences) {
    return true;
  }

  return Boolean(preferences[preferenceField]);
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, projectId, type, title, body, metadata } = params;

  const allowed = await shouldDeliverNotification(userId, type);
  if (!allowed) {
    return null;
  }

  const [created] = await db
    .insert(notifications)
    .values({
      userId,
      projectId: projectId ?? null,
      type,
      title,
      body,
      metadata: metadata ?? null
    })
    .returning({ id: notifications.id });

  return created?.id ?? null;
}

export async function listNotifications(params: ListNotificationsParams) {
  const { userId, status = "all", limit = 20 } = params;

  const conditions = [eq(notifications.userId, userId) as SQL<unknown>];
  if (status === "unread") {
    conditions.push(isNull(notifications.readAt));
  }

  const whereClause = conditions.reduce<SQL<unknown> | undefined>(
    (acc, condition) => (acc ? and(acc, condition) : condition),
    undefined
  );

  const baseQuery = db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      metadata: notifications.metadata,
      projectId: notifications.projectId,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt
    })
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  const rows = whereClause ? await baseQuery.where(whereClause) : await baseQuery;

  return rows;
}

export async function markNotifications(params: MarkNotificationsParams) {
  const { userId, ids, markAll } = params;
  const now = new Date();

  if (markAll) {
    const result = await db
      .update(notifications)
      .set({ readAt: now, updatedAt: now })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return result.rowCount ?? 0;
  }

  if (!ids || ids.length === 0) {
    return 0;
  }

  const result = await db
    .update(notifications)
    .set({ readAt: now, updatedAt: now })
    .where(and(eq(notifications.userId, userId), inArray(notifications.id, ids)));

  return result.rowCount ?? 0;
}

export async function countUnreadNotifications(userId: string) {
  return runSafeNotificationOperation(async () => {
    const result = await db
      .select({
        value: sql<number>`count(*)`
      })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return result.at(0)?.value ?? 0;
  }, 0);
}

export async function notifyProjectOwner(
  projectId: string,
  payload: Omit<CreateNotificationParams, "userId" | "projectId"> & { skipIfOwnerId?: string }
) {
  const project = await db.query.projects.findFirst({
    where: (proj, { eq }) => eq(proj.id, projectId),
    columns: { ownerId: true }
  });

  if (!project?.ownerId) {
    return null;
  }

  if (payload.skipIfOwnerId && payload.skipIfOwnerId === project.ownerId) {
    return null;
  }

  return createNotification({
    userId: project.ownerId,
    projectId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    metadata: payload.metadata ?? null
  });
}

export async function notifyStaff(payload: Omit<CreateNotificationParams, "userId">) {
  const staffProfiles = await db.query.profiles.findMany({
    where: (profile, { eq }) => eq(profile.role, "staff"),
    columns: { id: true }
  });

  if (staffProfiles.length === 0) {
    return [];
  }

  const insertedIds: Array<string | null> = [];

  for (const staff of staffProfiles) {
    const id = await createNotification({
      ...payload,
      userId: staff.id
    });
    insertedIds.push(id);
  }

  return insertedIds;
}

export async function notifyProjectParticipants(params: {
  projectId: string;
  excludeUserIds?: string[];
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  includeStaff?: boolean;
  includeOwner?: boolean;
}) {
  const {
    projectId,
    excludeUserIds = [],
    type,
    title,
    body,
    metadata,
    includeStaff = true,
    includeOwner = true
  } = params;

  const exclusions = new Set(excludeUserIds);
  const createdIds: string[] = [];

  if (includeOwner) {
    const owner = await db
      .select({ ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .then((rows) => rows.at(0));

    if (owner?.ownerId && !exclusions.has(owner.ownerId)) {
      const notificationId = await createNotification({
        userId: owner.ownerId,
        projectId,
        type,
        title,
        body,
        metadata: metadata ?? null
      });
      if (notificationId) {
        createdIds.push(notificationId);
      }
    }
  }

  if (includeStaff) {
    const staffProfiles = await db.query.profiles.findMany({
      where: (profile, { eq }) => eq(profile.role, "staff"),
      columns: { id: true }
    });

    for (const staff of staffProfiles) {
      if (exclusions.has(staff.id)) {
        continue;
      }
      const notificationId = await createNotification({
        userId: staff.id,
        projectId,
        type,
        title,
        body,
        metadata: metadata ?? null
      });
      if (notificationId) {
        createdIds.push(notificationId);
      }
    }
  }

  return createdIds;
}

export async function ensureNotificationDefaults(userId: string, role: UserRole) {
  return runSafeNotificationOperation(async () => {
    const existing = await db.query.notificationPreferences.findFirst({
      where: (prefs, { eq }) => eq(prefs.userId, userId)
    });

    if (existing) {
      return existing;
    }

    const defaults = {
      userId,
      emailNotifications: role === "client",
      ticketUpdates: true,
      fileUpdates: true,
      billingUpdates: true,
      onboardingUpdates: true,
      marketing: false
    } satisfies typeof notificationPreferences.$inferInsert;

    await db.insert(notificationPreferences).values(defaults).onConflictDoNothing();

    return defaults;
  }, null);
}
