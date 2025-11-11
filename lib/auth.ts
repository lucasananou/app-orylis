import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { db, schema } from "./db";
import { profiles } from "./schema";

const fromAddress = process.env.EMAIL_FROM;

if (!fromAddress) {
  throw new Error("EMAIL_FROM is not set. Define it in your environment.");
}

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function ensureProfile(userId: string) {
  await db
    .insert(profiles)
    .values({
      id: userId,
      role: "client"
    })
    .onConflictDoNothing({ target: profiles.id });
}

async function fetchUserRole(userId: string) {
  const record = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: {
      role: true
    }
  });

  return record?.role ?? "client";
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, schema as any),
  session: { strategy: "jwt" },
  providers: [
    EmailProvider({
      from: fromAddress,
      maxAge: 60 * 60 * 24,
      async sendVerificationRequest({ identifier, url }) {
        if (!resendClient) {
          console.info(`[Auth] Magic link for ${identifier}: ${url}`);
          return;
        }

        const { error } = await resendClient.emails.send({
          from: fromAddress,
          to: identifier,
          subject: "Votre accès à Orylis Hub",
          html: `
            <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background-color: #F7F9FB;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px;">
                <tr>
                  <td>
                    <h1 style="color: #0F172A; font-size: 20px; font-weight: 600; margin: 0 0 16px;">Connexion à Orylis Hub</h1>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                      Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans 24 heures.
                    </p>
                    <p style="text-align: center; margin: 0 0 24px;">
                      <a href="${url}" style="background: #43b2b9; color: #0F172A; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 999px; display: inline-block;">
                        Se connecter
                      </a>
                    </p>
                    <p style="color: #64748B; font-size: 13px; line-height: 1.6; margin: 0;">
                      Si vous n’avez pas demandé ce lien, vous pouvez ignorer cet email.
                    </p>
                  </td>
                </tr>
              </table>
            </div>
          `.trim()
        });

        if (error) {
          throw new Error(`Resend sendVerificationRequest failed: ${error.message}`);
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.id) {
        return false;
      }

      await ensureProfile(user.id);
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (!token.sub) {
        return token;
      }

      if (user || trigger === "signIn" || !token.role) {
        token.role = await fetchUserRole(token.sub);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as "client" | "staff") ?? "client";
      }
      return session;
    }
  }
};

const authHandler = NextAuth(authOptions);

export const handlers = authHandler.handlers;
export const auth = authHandler.auth;
export const signIn = authHandler.signIn;
export const signOut = authHandler.signOut;

export async function getSessionUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    userId: session.user.id,
    role: session.user.role
  };
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

