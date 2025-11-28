import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Vérifier les permissions (staff ou admin)
        const user = await db.query.authUsers.findFirst({
            where: (users, { eq }) => eq(users.id, session.user.id),
            with: {
                profile: true
            }
        });

        if (user?.profile?.role !== "staff") {
            return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
        }

        const { id } = await params;

        // Supprimer le devis
        await db.delete(quotes).where(eq(quotes.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting quote:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression du devis" },
            { status: 500 }
        );
    }
}
