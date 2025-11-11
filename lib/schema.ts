import { relations, sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  pgTableCreator,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  boolean,
  integer,
  index
} from "drizzle-orm/pg-core";

const createTable = pgTableCreator((name) => `orylis_${name}`);

export const authUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { withTimezone: true }),
  image: text("image")
});

export const profileRoleEnum = pgEnum("profile_role", ["client", "staff"]);
export const projectStatusEnum = pgEnum("project_status", [
  "onboarding",
  "design",
  "build",
  "review",
  "delivered"
]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "done"]);
export const storageProviderEnum = pgEnum("storage_provider", [
  "blob",
  "s3",
  "r2",
  "uploadthing"
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "ticket_created",
  "ticket_updated",
  "file_uploaded",
  "billing_added",
  "onboarding_update",
  "system"
]);

export const profiles = createTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: profileRoleEnum("role").notNull().default("client"),
    fullName: text("full_name"),
    company: text("company"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (profile) => ({
    roleIdx: index("profiles_role_idx").on(profile.role)
  })
);

export const projects = createTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: projectStatusEnum("status").notNull().default("onboarding"),
    progress: integer("progress").notNull().default(10),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (project) => ({
    ownerIdx: index("projects_owner_id_idx").on(project.ownerId)
  })
);

export const onboardingResponses = createTable(
  "onboarding_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    payload: jsonb("payload").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (response) => ({
    projectIdx: index("onboarding_project_id_idx").on(response.projectId)
  })
);

export const tickets = createTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: ticketStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (ticket) => ({
    projectIdx: index("tickets_project_id_idx").on(ticket.projectId),
    authorIdx: index("tickets_author_id_idx").on(ticket.authorId)
  })
);

export const files = createTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    storageProvider: storageProviderEnum("storage_provider").notNull().default("blob"),
    path: text("path").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (file) => ({
    projectIdx: index("files_project_id_idx").on(file.projectId),
    uploaderIdx: index("files_uploader_id_idx").on(file.uploaderId)
  })
);

export const billingLinks = createTable(
  "billing_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (link) => ({
    projectIdx: index("billing_project_id_idx").on(link.projectId)
  })
);

export const notifications = createTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "set null" }),
    type: notificationTypeEnum("type").notNull().default("system"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    metadata: jsonb("metadata"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (notification) => ({
    userIdx: index("notifications_user_id_idx").on(notification.userId),
    projectIdx: index("notifications_project_id_idx").on(notification.projectId),
    readIdx: index("notifications_read_at_idx").on(notification.readAt)
  })
);

export const notificationPreferences = createTable(
  "notification_preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    ticketUpdates: boolean("ticket_updates").notNull().default(true),
    fileUpdates: boolean("file_updates").notNull().default(true),
    billingUpdates: boolean("billing_updates").notNull().default(true),
    onboardingUpdates: boolean("onboarding_updates").notNull().default(true),
    marketing: boolean("marketing").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  }
);

export const userCredentials = createTable(
  "user_credentials",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (credentials) => ({
    userIdx: index("user_credentials_user_id_idx").on(credentials.userId)
  })
);

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  projects: many(projects),
  tickets: many(tickets),
  files: many(files),
  notifications: many(notifications),
  notificationPreferences: one(notificationPreferences, {
    fields: [profiles.id],
    references: [notificationPreferences.userId]
  })
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [projects.ownerId],
    references: [profiles.id]
  }),
  onboardingResponses: many(onboardingResponses),
  tickets: many(tickets),
  files: many(files),
  billingLinks: many(billingLinks),
  notifications: many(notifications)
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id]
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id]
  })
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(profiles, {
      fields: [notificationPreferences.userId],
      references: [profiles.id]
    })
  })
);

export const authUsersRelations = relations(authUsers, ({ one }) => ({
  profile: one(profiles, {
    fields: [authUsers.id],
    references: [profiles.id]
  }),
  credentials: one(userCredentials, {
    fields: [authUsers.id],
    references: [userCredentials.userId]
  })
}));
