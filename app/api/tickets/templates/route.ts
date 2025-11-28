import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ticketTemplates } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { z } from "zod";

const templateSchema = z.object({
    title: z.string().min(1, "Le titre est requis"),
    content: z.string().min(1, "Le contenu est requis")
});

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await db
        .select()
        .from(ticketTemplates)
        .orderBy(desc(ticketTemplates.createdAt));

    return NextResponse.json({ data: templates });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = templateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const [created] = await db
        .insert(ticketTemplates)
        .values({
            title: parsed.data.title,
            content: parsed.data.content
        })
        .returning();

    return NextResponse.json({ data: created }, { status: 201 });
}
