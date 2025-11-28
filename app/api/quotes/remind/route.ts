import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { assertStaff } from "@/lib/utils";
import { sendQuoteReminderEmail } from "@/lib/emails";

const BodySchema = z.object({
    projectId: z.string().uuid(),
    type: z.enum(["3days", "7days"]).default("3days")
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        assertStaff(session.user.role);

        const json = await req.json();
        const { projectId, type } = BodySchema.parse(json);

        // Récupérer le devis en attente
        const quote = await db.query.quotes.findFirst({
            where: (q, { eq, and }) => and(eq(q.projectId, projectId), eq(q.status, "pending")),
            columns: { id: true }
        });

        if (!quote) {
            return NextResponse.json({ error: "Aucun devis en attente pour ce projet." }, { status: 404 });
        }

        // Récupérer le projet pour le nom
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
            columns: { name: true, ownerId: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
        }

        // Envoyer l'email de relance
        const result = await sendQuoteReminderEmail(
            project.ownerId,
            project.name,
            quote.id,
            type
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Quote Reminder] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erreur serveur" },
            { status: 500 }
        );
    }
}
