import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "client" | "staff";
    };
  }

  interface User {
    role?: "client" | "staff";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "client" | "staff";
  }
}

