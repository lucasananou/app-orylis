"use client";

import * as React from "react";
import { ClipboardList, Edit3, ChevronLeft, ChevronRight } from "lucide-react";
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
    demoUrl?: string | null;
    ownerId: string;
    ownerName: string | null;
  }>;
  role: "prospect" | "client" | "staff" | "sales";
  ownerOptions: Array<{ id: string; name: string }>;
}

const PROJECTS_PER_PAGE = 6;

export function DashboardProjects({ projects, role, ownerOptions }: DashboardProjectsProps) {
  const { projectId, setProjectId, ready } = useProjectSelection();
  const staff = isStaff(role);
  const hasProjects = projects.length > 0;
  const [currentPage, setCurrentPage] = React.useState(1);

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

  // Pour le staff : afficher tous les projets par défaut, filtrer seulement si un projet est explicitement sélectionné
  // Pour les clients : afficher le projet sélectionné ou le premier projet
  const activeProjectId = staff ? (projectId ?? null) : (projectId ?? projects[0]?.id ?? null);

  const filteredProjects =
    activeProjectId && (staff ? projectId !== null : true)
      ? projects.filter((project) => project.id === activeProjectId)
      : projects;

  // Réinitialiser la page quand on change de filtre
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeProjectId, staff]);

  if (filteredProjects.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Aucun projet sélectionné"
        description="Choisissez un projet via le sélecteur en haut de page."
      />
    );
  }

  // Pagination : seulement si on affiche tous les projets (staff sans sélection)
  const showPagination = staff && projectId === null && filteredProjects.length > PROJECTS_PER_PAGE;
  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
  const startIndex = showPagination ? (currentPage - 1) * PROJECTS_PER_PAGE : 0;
  const endIndex = showPagination ? startIndex + PROJECTS_PER_PAGE : filteredProjects.length;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedProjects.map((project) => (
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
                    demoUrl: project.demoUrl ?? null,
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

      {showPagination && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="min-h-[44px]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="min-h-[44px]"
          >
            Suivant
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

