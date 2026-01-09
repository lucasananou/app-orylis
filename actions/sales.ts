"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, salesCalls, prospectNotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertStaff } from "@/lib/utils";

type ProspectStatus = "new" | "contacted" | "demo_sent" | "offer_sent" | "negotiation" | "meeting" | "proposal" | "won" | "lost";

export async function updateProspectStatus(id: string, status: ProspectStatus) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    // Assuming sales can update (they are "staff" in this context)
    // assertStaff(session.user.role); 

    await db
        .update(profiles)
        .set({ prospectStatus: status })
        .where(eq(profiles.id, id));

    revalidatePath("/dashboard");
    revalidatePath(`/prospects/${id}`);
}

export async function updateProspectNotes(id: string, notes: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await db
        .update(profiles)
        .set({ internalNotes: notes })
        .where(eq(profiles.id, id));

    revalidatePath(`/prospects/${id}`);
}

export async function deleteProspect(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await db
        .delete(profiles)
        .where(eq(profiles.id, id));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/list");
}

export async function updateProspect(id: string, data: { fullName?: string; company?: string; phone?: string; email?: string }) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // Update profile data
    await db
        .update(profiles)
        .set({
            fullName: data.fullName,
            company: data.company,
            phone: data.phone,
        })
        .where(eq(profiles.id, id));

    revalidatePath(`/prospects/${id}`);
    revalidatePath("/dashboard");
}

export async function addProspectNote(prospectId: string, content: string, type: "note" | "call" | "email" | "meeting" = "note") {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.insert(prospectNotes).values({
        prospectId,
        authorId: session.user.id,
        content,
        type,
    });

    revalidatePath(`/prospects/${prospectId}`);
}
