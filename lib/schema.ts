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
  index,
  primaryKey
} from "drizzle-orm/pg-core";

const createTable = pgTableCreator((name) => `orylis_${name}`);

export const authUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { withTimezone: true }),
  image: text("image")
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const prospectStatusEnum = pgEnum("prospect_status", [
  "new",
  "contacted",
  "demo_sent", // Legacy
  "offer_sent", // Legacy
  "negotiation", // Legacy
  "meeting",
  "proposal",
  "won",
  "lost"
]);
export const profileRoleEnum = pgEnum("profile_role", ["prospect", "client", "staff", "sales"]);
export const projectStatusEnum = pgEnum("project_status", [
  "onboarding",
  "demo_in_progress",
  "design",
  "build",
  "review",
  "delivered"
]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "done"]);
export const ticketCategoryEnum = pgEnum("ticket_category", [
  "request",
  "feedback",
  "issue",
  "general"
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent"
]);
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

export const emailTemplateTypeEnum = pgEnum("email_template_type", [
  "welcome",
  "project_created",
  "prospect_promoted",
  "ticket_created",
  "ticket_reply",
  "ticket_updated",
  "file_uploaded",
  "onboarding_completed",
  "project_updated",
  "prospect_welcome",
  "prospect_onboarding_completed",
  "prospect_demo_ready",
  "quote_signed",
  "quote_signed_admin"
]);

export const profiles = createTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: profileRoleEnum("role").notNull().default("prospect"),
    fullName: text("full_name"),
    company: text("company"),
    phone: text("phone"),
    referrerId: text("referrer_id"),
    internalNotes: text("internal_notes"), // Notes internes pour le CRM (Admin uniquement)
    prospectStatus: prospectStatusEnum("prospect_status").notNull().default("new"),
    meetingBookedAt: timestamp("meeting_booked_at", { withTimezone: true }),
    // Google Calendar Integration
    googleAccessToken: text("google_access_token"),
    googleRefreshToken: text("google_refresh_token"),
    googleTokenExpiry: timestamp("google_token_expiry", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (profile) => ({
    roleIdx: index("profiles_role_idx").on(profile.role),
    referrerIdx: index("profiles_referrer_id_idx").on(profile.referrerId)
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
    demoUrl: text("demo_url"),
    googlePropertyId: text("google_property_id"),
    hostingExpiresAt: timestamp("hosting_expires_at", { withTimezone: true }),
    maintenanceActive: boolean("maintenance_active").notNull().default(false),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (project) => ({
    ownerIdx: index("projects_owner_id_idx").on(project.ownerId)
  })
);

export const onboardingTypeEnum = pgEnum("onboarding_type", ["prospect", "client"]);

export const onboardingResponses = createTable(
  "onboarding_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: onboardingTypeEnum("type").notNull().default("prospect"),
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

export const salesCalls = createTable(
  "sales_calls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    stepOpening: jsonb("step_opening"),
    stepDiscovery: jsonb("step_discovery"),
    stepNeeds: jsonb("step_needs"),
    stepSolution: jsonb("step_solution"),
    stepPrice: jsonb("step_price"),
    stepObjections: jsonb("step_objections"),
    stepClosing: jsonb("step_closing"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (call) => ({
    prospectIdx: index("sales_calls_prospect_id_idx").on(call.prospectId)
  })
);

export const onboardingDrafts = createTable(
  "onboarding_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique().notNull(),
    phone: text("phone"),
    payload: jsonb("payload").notNull(),
    step: integer("step").notNull().default(0),
    alertedAt: timestamp("alerted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (draft) => ({
    emailIdx: index("onboarding_drafts_email_idx").on(draft.email),
    createdIdx: index("onboarding_drafts_created_at_idx").on(draft.createdAt)
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
    priority: ticketPriorityEnum("priority").notNull().default("medium"),
    category: ticketCategoryEnum("category").notNull().default("request"),
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
    authorIdx: index("tickets_author_id_idx").on(ticket.authorId),
    statusIdx: index("tickets_status_idx").on(ticket.status),
    createdAtIdx: index("tickets_created_at_idx").on(ticket.createdAt)
  })
);

export const ticketMessages = createTable(
  "ticket_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (message) => ({
    ticketIdx: index("ticket_messages_ticket_id_idx").on(message.ticketId),
    authorIdx: index("ticket_messages_author_id_idx").on(message.authorId)
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
    ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
    messageId: uuid("message_id").references(() => ticketMessages.id, { onDelete: "set null" }),
    storageProvider: storageProviderEnum("storage_provider").notNull().default("blob"),
    path: text("path").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (file) => ({
    projectIdx: index("files_project_id_idx").on(file.projectId),
    uploaderIdx: index("files_uploader_id_idx").on(file.uploaderId),
    ticketIdx: index("files_ticket_id_idx").on(file.ticketId),
    messageIdx: index("files_message_id_idx").on(file.messageId)
  })
);

export const ticketTemplates = createTable("ticket_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => sql`now()`)
});

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

export const projectMessages = createTable(
  "project_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (message) => ({
    projectIdx: index("project_messages_project_id_idx").on(message.projectId),
    authorIdx: index("project_messages_author_id_idx").on(message.authorId),
    createdAtIdx: index("project_messages_created_at_idx").on(message.createdAt)
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

export const knowledgeArticles = createTable(
  "knowledge_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category"),
    published: boolean("published").notNull().default(true),
    authorId: text("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (article) => ({
    authorIdx: index("knowledge_articles_author_id_idx").on(article.authorId),
    publishedIdx: index("knowledge_articles_published_idx").on(article.published),
    categoryIdx: index("knowledge_articles_category_idx").on(article.category)
  })
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

export const emailTemplates = createTable(
  "email_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: emailTemplateTypeEnum("type").notNull().unique(),
    subject: text("subject").notNull(),
    htmlContent: text("html_content").notNull(),
    textContent: text("text_content"),
    variables: jsonb("variables"), // Ex: ["userName", "projectName", "ticketTitle"]
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (template) => ({
    typeIdx: index("email_templates_type_idx").on(template.type)
  })
);

export const quoteStatusEnum = pgEnum("quote_status", ["pending", "signed", "cancelled"]);

export const quotes = createTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    pdfUrl: text("pdf_url").notNull(), // URL du PDF non signé
    signedPdfUrl: text("signed_pdf_url"), // URL du PDF signé
    number: integer("number"), // Numéro séquentiel du devis
    status: quoteStatusEnum("status").notNull().default("pending"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    amount: integer("amount"), // Montant total HT en centimes
    services: jsonb("services"), // Liste des services inclus
    delay: text("delay"), // Délai de livraison
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (quote) => ({
    projectIdx: index("quotes_project_id_idx").on(quote.projectId),
    statusIdx: index("quotes_status_idx").on(quote.status)
  })
);

export const briefStatusEnum = pgEnum("brief_status", ["draft", "sent", "approved", "rejected"]);

export const projectBriefs = createTable(
  "project_briefs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: text("content").notNull(),
    status: briefStatusEnum("status").notNull().default("draft"),
    clientComment: text("client_comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (brief) => ({
    projectIdx: index("project_briefs_project_id_idx").on(brief.projectId),
    statusIdx: index("project_briefs_status_idx").on(brief.status)
  })
);

export const salesCallsRelations = relations(salesCalls, ({ one }) => ({
  prospect: one(profiles, {
    fields: [salesCalls.prospectId],
    references: [profiles.id]
  })
}));

// ... (existing relations)

// ... enum definitions
export const prospectNoteTypeEnum = pgEnum("prospect_note_type", ["note", "call", "email", "meeting"]);

export const prospectNotes = createTable(
  "prospect_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: prospectNoteTypeEnum("type").notNull().default("note"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (note) => ({
    prospectIdx: index("prospect_notes_prospect_id_idx").on(note.prospectId),
    createdIdx: index("prospect_notes_created_at_idx").on(note.createdAt)
  })
);

export const prospectNotesRelations = relations(prospectNotes, ({ one }) => ({
  prospect: one(profiles, {
    fields: [prospectNotes.prospectId],
    references: [profiles.id]
  }),
  author: one(profiles, {
    fields: [prospectNotes.authorId],
    references: [profiles.id]
  })
}));

// ... existing code ...

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasks = createTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    assignedToId: text("assigned_to_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completed: boolean("completed").notNull().default(false),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date())
  },
  (task) => ({
    prospectIdx: index("tasks_prospect_id_idx").on(task.prospectId),
    assignedToIdx: index("tasks_assigned_to_id_idx").on(task.assignedToId),
    completedIdx: index("tasks_completed_idx").on(task.completed)
  })
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  prospect: one(profiles, {
    fields: [tasks.prospectId],
    references: [profiles.id],
    relationName: "prospect_tasks"
  }),
  assignee: one(profiles, {
    fields: [tasks.assignedToId],
    references: [profiles.id],
    relationName: "assigned_tasks"
  })
}));

// Update profiles relations
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  projects: many(projects),
  salesCalls: many(salesCalls),
  tickets: many(tickets),
  ticketMessages: many(ticketMessages),
  files: many(files),
  notifications: many(notifications),
  invoices: many(invoices),
  prospectNotes: many(prospectNotes),
  tasksAsProspect: many(tasks, { relationName: "prospect_tasks" }), // Tasks linked to this prospect
  tasksAsAssignee: many(tasks, { relationName: "assigned_tasks" }), // Tasks assigned to this user
  calendarEventsAsProspect: many(calendarEvents, { relationName: "prospect_events" }),
  calendarEventsAsCreator: many(calendarEvents, { relationName: "created_events" }),
  // ... existing relations
  notificationPreferences: one(notificationPreferences, {
    fields: [profiles.id],
    references: [notificationPreferences.userId]
  }),
  referrer: one(profiles, {
    fields: [profiles.referrerId],
    references: [profiles.id],
    relationName: "referral"
  }),
  referrals: many(profiles, {
    relationName: "referral"
  }),
  authUser: one(authUsers, {
    fields: [profiles.id],
    references: [authUsers.id]
  })
}));


// ... (remaining relations)

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "paused",
  "trialing",
  "unpaid"
]);

export const serviceTypeEnum = pgEnum("service_type", ["seo", "maintenance", "blog"]);

export const subscriptions = createTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    stripeCustomerId: text("stripe_customer_id"),
    status: subscriptionStatusEnum("status").notNull(),
    serviceType: serviceTypeEnum("service_type").notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    isManual: boolean("is_manual").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
  },
  (sub) => ({
    projectIdx: index("subscriptions_project_id_idx").on(sub.projectId),
    stripeSubIdx: index("subscriptions_stripe_subscription_id_idx").on(sub.stripeSubscriptionId),
    statusIdx: index("subscriptions_status_idx").on(sub.status)
  })
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  project: one(projects, {
    fields: [subscriptions.projectId],
    references: [projects.id]
  })
}));

// Update projects relations to include subscriptions
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [projects.ownerId],
    references: [profiles.id]
  }),
  onboardingResponses: many(onboardingResponses),
  tickets: many(tickets),
  ticketMessages: many(ticketMessages),
  files: many(files),
  billingLinks: many(billingLinks),
  notifications: many(notifications),
  quotes: many(quotes),
  subscriptions: many(subscriptions),
  briefs: many(projectBriefs),
  invoices: many(invoices)
}));


export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id]
  }),
  author: one(profiles, {
    fields: [tickets.authorId],
    references: [profiles.id]
  }),
  messages: many(ticketMessages)
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id]
  }),
  author: one(profiles, {
    fields: [ticketMessages.authorId],
    references: [profiles.id]
  })
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

export const knowledgeArticlesRelations = relations(knowledgeArticles, ({ one }) => ({
  author: one(profiles, {
    fields: [knowledgeArticles.authorId],
    references: [profiles.id]
  })
}));

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

export const quotesRelations = relations(quotes, ({ one }) => ({
  project: one(projects, {
    fields: [quotes.projectId],
    references: [projects.id]
  })
}));

export const passwordResetTokens = createTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (t) => ({
    userIdx: index("password_reset_tokens_user_id_idx").on(t.userId),
    tokenIdx: index("password_reset_tokens_token_idx").on(t.token)
  })
);

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(authUsers, {
    fields: [passwordResetTokens.userId],
    references: [authUsers.id]
  })
}));

export const invoiceStatusEnum = pgEnum("invoice_status", ["paid", "pending", "void"]);
export const invoiceTypeEnum = pgEnum("invoice_type", ["deposit", "balance", "standard"]);

export const invoices = createTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    number: integer("number").notNull(), // Séquentiel, ex: 2024001
    amount: integer("amount").notNull(), // En centimes
    status: invoiceStatusEnum("status").notNull().default("pending"),
    type: invoiceTypeEnum("type").notNull().default("standard"),
    pdfUrl: text("pdf_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (invoice) => ({
    projectIdx: index("invoices_project_id_idx").on(invoice.projectId),
    userIdx: index("invoices_user_id_idx").on(invoice.userId),
    numberIdx: index("invoices_number_idx").on(invoice.number)
  })
);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id]
  }),
  user: one(profiles, {
    fields: [invoices.userId],
    references: [profiles.id]
  })
}));

export const projectBriefsRelations = relations(projectBriefs, ({ one }) => ({
  project: one(projects, {
    fields: [projectBriefs.projectId],
    references: [projects.id]
  })
}));

// Calendar Events System
export const eventTypeEnum = pgEnum("event_type", ["demo", "followup", "closing", "support", "other"]);
export const eventStatusEnum = pgEnum("event_status", ["scheduled", "completed", "cancelled", "no_show"]);

export const calendarEvents = createTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    type: eventTypeEnum("type").notNull().default("demo"),
    status: eventStatusEnum("status").notNull().default("scheduled"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    meetingUrl: text("meeting_url"), // Zoom, Google Meet, etc.
    location: text("location"),
    googleEventId: text("google_event_id"), // For sync with Google Calendar
    notes: text("notes"),
    reminderSent: boolean("reminder_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date())
  },
  (event) => ({
    prospectIdx: index("calendar_events_prospect_id_idx").on(event.prospectId),
    createdByIdx: index("calendar_events_created_by_id_idx").on(event.createdById),
    startTimeIdx: index("calendar_events_start_time_idx").on(event.startTime),
    statusIdx: index("calendar_events_status_idx").on(event.status)
  })
);

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  prospect: one(profiles, {
    fields: [calendarEvents.prospectId],
    references: [profiles.id],
    relationName: "prospect_events"
  }),
  createdBy: one(profiles, {
    fields: [calendarEvents.createdById],
    references: [profiles.id],
    relationName: "created_events"
  })
}));

// Update profiles relations to include calendar events
