import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import { OnboardingForm } from "@/components/form/onboarding-form";
import { isStaff } from "@/lib/utils";

// Cache 10 secondes
export const revalidate = 10;

async function loadOnboardingData(projectId: string) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = session.user!;
    const staff = isStaff(user.role);

    console.log("[ProjectOnboarding] User:", user.id, "Staff:", staff, "ProjectID:", projectId);

    const project = await db
        .select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            progress: projects.progress,
            responseId: onboardingResponses.id,
            responsePayload: onboardingResponses.payload,
            responseCompleted: onboardingResponses.completed,
            responseUpdatedAt: onboardingResponses.updatedAt
        })
        .from(projects)
        .leftJoin(
            onboardingResponses,
            and(
                eq(onboardingResponses.projectId, projects.id),
                eq(onboardingResponses.type, "client")
            )
        )
        .where(
            staff
                ? eq(projects.id, projectId)
                : and(eq(projects.id, projectId), eq(projects.ownerId, user.id))
        )
        .limit(1)
        .then((rows) => rows[0]);

    if (!project) {
        console.log("[ProjectOnboarding] Project not found or access denied.");
        redirect("/");
    }

    const projectEntry = {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        payload: (project.responsePayload as Record<string, unknown> | null) ?? null,
        completed: project.responseCompleted ?? false,
        updatedAt: project.responseUpdatedAt ? project.responseUpdatedAt.toISOString() : null
    };

    return { projectEntry, role: user.role };
}

export default async function ProjectOnboardingPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    console.log("[ProjectOnboarding] Loading for project:", params.id);

    const { projectEntry, role } = await loadOnboardingData(params.id);

    return (
        <div className="mx-auto max-w-5xl py-8">
            <OnboardingForm projects={[projectEntry]} role={role} />
        </div>
    );
}
