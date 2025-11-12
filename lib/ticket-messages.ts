import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, ticketMessages } from "@/lib/schema";

export interface TicketMessageWithAuthor {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    fullName: string | null;
    email: string | null;
    role: "prospect" | "client" | "staff";
  };
}

export async function listTicketMessages(ticketId: string): Promise<TicketMessageWithAuthor[]> {
  const rows = await db
    .select({
      id: ticketMessages.id,
      body: ticketMessages.body,
      createdAt: ticketMessages.createdAt,
      authorId: ticketMessages.authorId,
      fullName: profiles.fullName,
      email: profiles.id,
      role: profiles.role
    })
    .from(ticketMessages)
    .innerJoin(profiles, eq(ticketMessages.authorId, profiles.id))
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(ticketMessages.createdAt);

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      fullName: row.fullName,
      email: row.email,
      role: row.role
    }
  }));
}
