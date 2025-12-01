import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboardingDrafts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, phone, step, ...payload } = body;

        if (!email) {
            return NextResponse.json({ error: "Email requis" }, { status: 400 });
        }

        // Upsert draft
        await db.insert(onboardingDrafts).values({
            email,
            phone: phone || null,
            step: step || 0,
            payload,
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: onboardingDrafts.email,
            set: {
                phone: phone || null,
                step: step || 0,
                payload,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Draft save error:", error);
        return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
    }
}
