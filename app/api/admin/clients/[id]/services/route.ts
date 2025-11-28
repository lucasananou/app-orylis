import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subscriptions, projects } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { assertStaff } from "@/lib/utils";
import { randomUUID } from "crypto";

const AddServiceSchema = z.object({
    serviceType: z.enum(["seo", "maintenance", "blog"]),
    projectId: z.string().uuid()
});

const RemoveServiceSchema = z.object({
    subscriptionId: z.string().uuid()
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        assertStaff(session.user.role);

        const json = await req.json();
        const { serviceType, projectId } = AddServiceSchema.parse(json);

        // Check if subscription already exists
        const existing = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.projectId, projectId),
                eq(subscriptions.serviceType, serviceType),
                eq(subscriptions.status, "active")
            )
        });

        if (existing) {
            return NextResponse.json({ error: "Ce service est déjà actif." }, { status: 400 });
        }

        // Create manual subscription
        // We use dummy values for Stripe fields since they are unique/required (unless made nullable, which we did in code)
        // If migration hasn't run, this might fail if fields are still NOT NULL.
        // But we assume migration will be run.
        // We use "manual_" prefix for unique fields to avoid collision.
        const id = randomUUID();

        await db.insert(subscriptions).values({
            id,
            projectId,
            stripeSubscriptionId: `manual_${id}`, // Unique constraint
            status: "active",
            serviceType,
            currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // Forever
            isManual: true,
            // Stripe fields are nullable now, so we can omit them or pass null
            stripePriceId: null,
            stripeCustomerId: null
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin/Services] Error adding service:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        assertStaff(session.user.role);

        const json = await req.json();
        const { subscriptionId } = RemoveServiceSchema.parse(json);

        await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin/Services] Error removing service:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
