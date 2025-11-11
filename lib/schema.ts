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
  primaryKey,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

const createTable = pgTableCreator((name) => `orylis_${name}`);

export const profileRoleEnum = pgEnum("profile_role", ["client", "staff"]);
export const projectStatusEnum = pgEnum("project_status", [
  "onboarding",
  "design",
  "build",
  "review",
  "delivered"
]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "done"]);
export const storageProviderEnum = pgEnum("storage_provider", ["blob", "s3", "r2", "uploadthing"]);

export const users = createTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image")
  },
  (user) => ({
    emailIdx: index("users_email_idx").on(user.email),
    emailUnique: uniqueIndex("users_email_unique").on(user.email)
  })
);

export const accounts = createTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type")
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state")
  },
  (account) => ({
    compoundPk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    userIdx: index("accounts_user_id_idx").on(account.userId)
  })
);

export const sessions = createTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull()
  },
  (session) => ({
    userIdx: index("sessions_user_id_idx").on(session.userId)
  })
);

export const verificationTokens = createTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull()
  },
  (token) => ({
    compoundPk: primaryKey({ columns: [token.identifier, token.token] })
  })
);

export const profiles = createTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
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
    ownerId: uuid("owner_id")
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
    authorId: uuid("author_id")
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
    uploaderId: uuid("uploader_id")
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

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id]
  }),
  accounts: many(accounts),
  sessions: many(sessions)
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  projects: many(projects),
  tickets: many(tickets),
  files: many(files)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [projects.ownerId],
    references: [profiles.id]
  }),
  onboardingResponses: many(onboardingResponses),
  tickets: many(tickets),
  files: many(files),
  billingLinks: many(billingLinks)
}));

