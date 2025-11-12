import { randomUUID } from "node:crypto";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { z } from "zod";
import { db } from "@/lib/db";
import { authUsers, profiles, userCredentials } from "@/lib/schema";
import { ensureNotificationDefaults } from "@/lib/notifications";

async function ensureProfile(userId: string) {
  await db
    .insert(profiles)
    .values({
      id: userId,
      role: "client",
    })
    .onConflictDoNothing({ target: profiles.id });

  await ensureNotificationDefaults(userId, "client");
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const TEST_USER_EMAIL = "demo@orylis.app";
const TEST_USER_PASSWORD = "OrylisDemo1!";

const authAdapter = DrizzleAdapter(db);

const adapterGetUserByEmail = authAdapter.getUserByEmail?.bind(authAdapter);
const adapterCreateUser = authAdapter.createUser?.bind(authAdapter);

async function ensureTestUser() {
  if (!adapterGetUserByEmail || !adapterCreateUser) {
    console.warn("[Auth] Adapter does not expose user helpers. Skipping test user seeding.");
    return;
  }

  try {
    const existingUser = await adapterGetUserByEmail(TEST_USER_EMAIL);
    let userId = existingUser?.id;

    if (!userId) {
      try {
        // Utiliser db.insert directement pour éviter les erreurs toISOString de l'adapter
        const newUserId = randomUUID();
        await db.insert(authUsers).values({
          id: newUserId,
          email: TEST_USER_EMAIL,
          name: "Compte démo"
          // emailVerified est omis, sera null par défaut
        });
        userId = newUserId;
      } catch (error) {
        const code = (error as { code?: string } | undefined)?.code;
        if (code !== "23505") {
          // Si ce n'est pas une erreur de duplication, logger mais continuer
          console.warn("[Auth] Failed to create test user:", error);
        }
        // Essayer de récupérer l'utilisateur existant
        const fallback = await adapterGetUserByEmail(TEST_USER_EMAIL);
        userId = fallback?.id;
      }
    }

    if (!userId) {
      return;
    }

    await ensureProfile(userId);
await db
  .update(profiles)
  .set({
    role: "staff",
    fullName: "Compte démo"
  })
  .where(eq(profiles.id, userId));

    const passwordHash = await hash(TEST_USER_PASSWORD, 12);

    const existingCredentials = await db.query.userCredentials.findFirst({
      where: (cred, { eq }) => eq(cred.userId, userId),
      columns: {
        userId: true
      }
    });

    if (existingCredentials) {
      await db
        .update(userCredentials)
        .set({ passwordHash })
        .where(eq(userCredentials.userId, userId));
    } else {
      await db.insert(userCredentials).values({
        userId,
        passwordHash
      });
    }
  } catch (error) {
    console.warn("[Auth] Unable to seed demo user:", error);
  }
}

async function fetchUserRole(userId: string) {
  const record = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { role: true },
  });

  return record?.role ?? "client";
}

await ensureTestUser();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: authAdapter,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email et mot de passe",
      credentials: {
        email: { label: "Adresse email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        if (!adapterGetUserByEmail) {
          return null;
        }

        const userRecord = await adapterGetUserByEmail(email);

        if (!userRecord?.id) {
          return null;
        }

        const credentialsRow = await db.query.userCredentials.findFirst({
          where: (cred, { eq }) => eq(cred.userId, userRecord.id),
          columns: {
            passwordHash: true
          }
        });

        if (!credentialsRow?.passwordHash) {
          return null;
        }

        const isValid = await compare(password, credentialsRow.passwordHash);

        if (!isValid) {
          return null;
        }

        await ensureProfile(userRecord.id);

        return {
          id: userRecord.id,
          email: userRecord.email ?? undefined,
          name: userRecord.name ?? undefined
        };
      }
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM ?? "noreply@orylis.fr",
      server: {
        host: process.env.EMAIL_HOST ?? "localhost",
        port: Number(process.env.EMAIL_PORT ?? 2525),
        auth: {
          user: process.env.EMAIL_USER ?? "dev",
          pass: process.env.EMAIL_PASS ?? "dev",
        },
        secure: false,
      },
      async sendVerificationRequest({ identifier, url }) {
        const isProd = process.env.NODE_ENV === "production";
        const hasResend = Boolean(process.env.RESEND_API_KEY);
        const hasRealSmtp =
          Boolean(process.env.EMAIL_HOST) &&
          Boolean(process.env.EMAIL_USER) &&
          Boolean(process.env.EMAIL_PASS);

        if (!isProd) {
          console.log("LOGIN_LINK:", url);
          return;
        }

        if (hasResend) {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY!);
          await resend.emails.send({
            to: identifier,
            from: process.env.EMAIL_FROM ?? "noreply@orylis.fr",
            subject: "Votre lien de connexion",
            html: `<p>Connectez-vous : <a href="${url}">${url}</a></p>`,
          });
          return;
        }

        if (hasRealSmtp) {
          const nodemailer = await import("nodemailer");
          const transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST!,
            port: Number(process.env.EMAIL_PORT ?? 587),
            secure: false,
            auth: {
              user: process.env.EMAIL_USER!,
              pass: process.env.EMAIL_PASS!,
            },
          });

          await transport.sendMail({
            to: identifier,
            from: process.env.EMAIL_FROM ?? "noreply@orylis.fr",
            subject: "Votre lien de connexion",
            text: `Connectez-vous : ${url}`,
          });
          return;
        }

        console.warn("[AUTH] Aucun provider mail configuré en production.");
        console.log("LOGIN_LINK:", url);
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.id) {
        return false;
      }

      await ensureProfile(user.id);
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (token.sub) {
        (token as JWT).role = await fetchUserRole(token.sub);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token as JWT).role ?? "client";
      }

      return session;
    },
  },
});


