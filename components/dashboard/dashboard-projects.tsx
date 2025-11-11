"use client";

import * as React from "react";
import { ClipboardList, Edit3 } from "lucide-react";
import { isStaff } from "@/lib/utils";
import { useProjectSelection } from "@/lib/project-selection";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/project-card";
import { ProjectEditorDialog } from "@/components/projects/project-editor-dialog";

interface DashboardProjectsProps {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    dueDate: string | null;
    ownerId: string;
    ownerName: string | null;
  }>;
  role: "client" | "staff";
  ownerOptions: Array<{ id: string; name: string }>;
}

export function DashboardProjects({ projects, role, ownerOptions }: DashboardProjectsProps) {
  const { projectId, setProjectId, ready } = useProjectSelection();
  const staff = isStaff(role);
  const hasProjects = projects.length > 0;

  React.useEffect(() => {
    if (!ready || staff || !hasProjects) {
      return;
    }
    if (!projectId) {
      setProjectId(projects[0]?.id ?? null);
    }
  }, [hasProjects, projectId, projects, ready, setProjectId, staff]);

  if (!ready) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white/80 p-6 text-center text-sm text-muted-foreground">
        Chargement des projets…
      </div>
    );
  }

  if (!hasProjects) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Aucun projet en cours"
        description="Lancez un onboarding pour démarrer votre premier projet."
      />
    );
  }

  const activeProjectId = staff ? projectId : projectId ?? projects[0].id;

  const filteredProjects =
    activeProjectId && (!staff || projectId)
      ? projects.filter((project) => project.id === activeProjectId)
      : projects;

  if (filteredProjects.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Aucun projet sélectionné"
        description="Choisissez un projet via le sélecteur en haut de page."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredProjects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          status={project.status}
          progress={project.progress}
          dueDate={project.dueDate}
          roleLabel={
            staff
              ? project.ownerName
                ? `Client · ${project.ownerName}`
                : "Client"
              : undefined
          }
          editTrigger={
            staff ? (
              <ProjectEditorDialog
                mode="edit"
                owners={ownerOptions}
                project={{
                  id: project.id,
                  name: project.name,
                  status: project.status,
                  progress: project.progress,
                  dueDate: project.dueDate,
                  ownerId: project.ownerId
                }}
                trigger={
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Éditer le projet"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                }
              />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}

