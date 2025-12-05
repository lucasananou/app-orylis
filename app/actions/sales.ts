"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { salesCalls } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSalesCall(prospectId: string) {
    const session = await auth();
    if (!session?.user) return null;

    const call = await db.query.salesCalls.findFirst({
        where: eq(salesCalls.prospectId, prospectId)
    });

    return call;
}

export async function saveSalesCall(prospectId: string, data: any) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        const existing = await db.query.salesCalls.findFirst({
            where: eq(salesCalls.prospectId, prospectId)
        });

        if (existing) {
            await db
                .update(salesCalls)
                .set({
                    ...data,
                    updatedAt: new Date()
                })
                .where(eq(salesCalls.id, existing.id));
        } else {
            await db.insert(salesCalls).values({
                prospectId,
                ...data
            });
        }

        revalidatePath(`/admin/clients/${prospectId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save sales call:", error);
        return { error: "Failed to save" };
    }
}
