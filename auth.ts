"use server";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import EmailProvider from "next-auth/providers/email";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";

async function ensureProfile(userId: string) {
  await db
    .insert(profiles)
    .values({
      id: userId,
      role: "client",
    })
    .onConflictDoNothing({ target: profiles.id });
}

async function fetchUserRole(userId: string) {
  const record = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { role: true },
  });

  return record?.role ?? "client";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM ?? "no-reply@orylis.app",
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
            from: process.env.EMAIL_FROM ?? "no-reply@orylis.app",
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
            from: process.env.EMAIL_FROM ?? "no-reply@orylis.app",
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


