import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ClipboardList } from "lucide-react";
import { OnboardingForm } from "@/components/form/onboarding-form";
import { isStaff } from "@/lib/utils";

const session = await auth();

if (!session?.user) {
  redirect("/login");
}

const user = session.user!;
const staff = isStaff(user.role);

const onboardingProjects = await db.query.projects.findMany({
  where: (project, { eq: eqFn }) => {
    const statusCondition = eqFn(project.status, "onboarding");
    if (staff) {
      return statusCondition;
    }
    return and(statusCondition, eqFn(project.ownerId, user.id));
  },
  columns: {
    id: true,
    name: true,
    status: true,
    progress: true
  },
  with: {
    onboardingResponses: {
      columns: {
        id: true,
        payload: true,
        completed: true,
        updatedAt: true
      }
    }
  },
  orderBy: (project, { asc: ascFn }) => ascFn(project.createdAt)
});

const projectEntries = onboardingProjects.map((project) => {
  const response = project.onboardingResponses.at(0);
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    progress: project.progress,
    payload: (response?.payload as Record<string, unknown> | null) ?? null,
    completed: response?.completed ?? false,
    updatedAt: response?.updatedAt?.toISOString() ?? null
  };
});

export default function OnboardingPage(): JSX.Element {
  if (onboardingProjects.length === 0) {
    return (
      <>
        <PageHeader
          title="Onboarding projet"
          description="Toutes les informations nécessaires pour lancer la production sont déjà renseignées."
        />
        <EmptyState
          icon={ClipboardList}
          title="Pas d’onboarding actif"
          description={
            staff
              ? "Sélectionnez un projet à mettre en onboarding dans le back-office."
              : "Votre onboarding est déjà complété ou en cours d’orchestration côté Orylis."
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Onboarding projet"
        description="Renseignez les informations clés pour lancer sereinement votre projet Orylis."
      />
      <OnboardingForm projects={projectEntries} role={user.role} />
    </>
  );
}

