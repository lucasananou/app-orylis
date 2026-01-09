import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, ticketMessages, files } from "@/lib/schema";

export interface TicketMessageWithAuthor {
  id: string;
  body: string;
  createdAt: Date;
  isInternal: boolean;
  files: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  author: {
    id: string;
    fullName: string | null;
    email: string | null;
    role: "prospect" | "client" | "staff" | "sales";
  };
}

export async function listTicketMessages(ticketId: string): Promise<TicketMessageWithAuthor[]> {
  const rows = await db
    .select({
      id: ticketMessages.id,
      body: ticketMessages.body,
      createdAt: ticketMessages.createdAt,
      isInternal: ticketMessages.isInternal,
      authorId: ticketMessages.authorId,
      fullName: profiles.fullName,
      email: profiles.id,
      role: profiles.role
    })
    .from(ticketMessages)
    .innerJoin(profiles, eq(ticketMessages.authorId, profiles.id))
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(ticketMessages.createdAt);

  const ticketFiles = await db.query.files.findMany({
    where: (f, { eq }) => eq(f.ticketId, ticketId)
  });

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    isInternal: row.isInternal,
    files: ticketFiles
      .filter((f) => f.messageId === row.id)
      .map((f) => ({
        name: f.label ?? "Fichier",
        url: f.path,
        type: "unknown", // We don't store type in DB currently, maybe infer from extension or just ignore
        size: 0 // We don't store size either
      })),
    author: {
      id: row.authorId,
      fullName: row.fullName,
      email: row.email,
      role: row.role
    }
  }));
}
