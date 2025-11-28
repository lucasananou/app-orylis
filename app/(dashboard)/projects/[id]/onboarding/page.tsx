import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingResponses, projects } from "@/lib/schema";
import { PageHeader } from "@/components/page-header";
import { OnboardingForm } from "@/components/form/onboarding-form";
import { assertUserCanAccessProject, isStaff } from "@/lib/utils";
import { ProspectOnboardingForm } from "@/components/form/prospect-onboarding-form";

export const revalidate = 0;

interface ProjectOnboardingPageProps {
    params: {
        id: string;
    };
}

export default async function ProjectOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const project = await db
        .select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            progress: projects.progress,
            ownerId: projects.ownerId,
            responseId: onboardingResponses.id,
            responsePayload: onboardingResponses.payload,
            responseCompleted: onboardingResponses.completed,
            responseUpdatedAt: onboardingResponses.updatedAt
        })
        .from(projects)
        .leftJoin(onboardingResponses, eq(onboardingResponses.projectId, projects.id))
        .where(eq(projects.id, id))
        .then((rows) => rows.at(0));

    if (!project) {
        notFound();
    }

    try {
        assertUserCanAccessProject({
            role: session.user.role,
            userId: session.user.id,
            ownerId: project.ownerId
        });
    } catch {
        redirect("/");
    }

    const payload = (project.responsePayload as Record<string, unknown> | null) ?? null;

    const projectEntry = {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        payload,
        completed: project.responseCompleted ?? false,
        updatedAt: project.responseUpdatedAt ? project.responseUpdatedAt.toISOString() : null
    };

    // Détection simple : si le payload contient "activity", c'est un onboarding prospect
    const isProspectPayload = payload && "activity" in payload;

    return (
        <>
            <PageHeader
                title="Détail de l'onboarding"
                description={`Réponses du formulaire pour le projet ${project.name}`}
            />
            {isProspectPayload ? (
                <ProspectOnboardingForm projects={[projectEntry]} />
            ) : (
                <OnboardingForm projects={[projectEntry]} role={session.user.role} />
            )}
        </>
    );
}
