"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const TaskSchema = z.object({
    title: z.string().min(1, "Le titre est requis"),
    prospectId: z.string().min(1, "Le prospect est requis"),
    dueDate: z.date().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function createTask(data: z.infer<typeof TaskSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const validated = TaskSchema.parse(data);

    await db.insert(tasks).values({
        title: validated.title,
        prospectId: validated.prospectId,
        assignedToId: session.user.id,
        dueDate: validated.dueDate,
        priority: validated.priority,
    });

    revalidatePath(`/prospects/${validated.prospectId}`);
}

export async function toggleTask(id: string, completed: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, id),
    });

    if (!task) throw new Error("Task not found");

    await db.update(tasks)
        .set({ completed })
        .where(eq(tasks.id, id));

    revalidatePath(`/prospects/${task.prospectId}`);
}

export async function deleteTask(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, id),
    });

    if (!task) throw new Error("Task not found");

    await db.delete(tasks).where(eq(tasks.id, id));

    revalidatePath(`/prospects/${task.prospectId}`);
}

export async function getProspectTasks(prospectId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return await db.query.tasks.findMany({
        where: eq(tasks.prospectId, prospectId),
        orderBy: [desc(tasks.createdAt)],
    });
}
