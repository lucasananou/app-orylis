import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "prospect" | "client" | "staff";
    };
  }

  interface User {
    role?: "prospect" | "client" | "staff";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "prospect" | "client" | "staff";
  }
}

