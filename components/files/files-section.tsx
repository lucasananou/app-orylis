'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { FileCard } from "@/components/file-card";
import { FileUploadDialog } from "@/components/files/file-upload-dialog";
import { useProjectSelection } from "@/lib/project-selection";
import { isStaff } from "@/lib/utils";

interface ProjectOption {
  id: string;
  name: string;
}

export interface FileItem {
  id: string;
  label: string;
  storageProvider: string;
  createdAt: string;
  projectId: string;
  projectName: string;
  canDelete: boolean;
}

interface FilesSectionProps {
  projects: ProjectOption[];
  files: FileItem[];
  role: "client" | "staff";
  canManage: boolean;
}

export function FilesSection({ projects, files, role, canManage }: FilesSectionProps) {
  const router = useRouter();
  const { projectId, setProjectId, ready } = useProjectSelection();
  const staff = isStaff(role);
  const hasProjects = projects.length > 0;

  React.useEffect(() => {
    if (!ready) {
      return;
    }
    if (!staff && hasProjects && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [ready, staff, hasProjects, projectId, projects, setProjectId]);

  const selectValue = staff ? projectId ?? "__all__" : projectId ?? (projects[0]?.id ?? "");
  const activeProjectId = staff && selectValue === "__all__" ? null : selectValue;
  const uploadDisabled = !canManage || !activeProjectId;

  const handleDownload = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/signed-url?fileId=${fileId}`, {
        method: "GET"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Impossible de générer le lien de téléchargement.");
      }

      const { downloadUrl } = (await response.json()) as { downloadUrl: string };
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la récupération du lien.";
      toast.error(message);
    }
  };

  const handleDelete = async (fileId: string) => {
    const confirmed = window.confirm("Supprimer ce fichier ?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Impossible de supprimer le fichier.");
      }

      toast.success("Fichier supprimé.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la suppression du fichier.";
      toast.error(message);
    }
  };

  const filteredFiles =
    activeProjectId && activeProjectId !== "__all__"
      ? files.filter((file) => file.projectId === activeProjectId)
      : files;

  if (!hasProjects) {
    return (
      <EmptyState
        icon={UploadPlaceholderIcon}
        title="Aucun projet disponible"
        description="Créez un projet ou finalisez l’onboarding pour déposer vos premiers fichiers."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Projet</span>
          <Select
            value={selectValue}
            onValueChange={(value) => {
              if (value === "__all__") {
                setProjectId(null);
              } else {
                setProjectId(value);
              }
            }}
            disabled={!ready}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Sélectionnez un projet" />
            </SelectTrigger>
            <SelectContent>
              {staff && (
                <SelectItem value="__all__">Tous les projets</SelectItem>
              )}
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FileUploadDialog
          projectId={typeof activeProjectId === "string" ? activeProjectId : ""}
          projects={projects}
          disabled={uploadDisabled}
        />
      </div>

      {filteredFiles.length === 0 ? (
        <EmptyState
          icon={UploadPlaceholderIcon}
          title="Aucun fichier pour ce projet"
          description="Déposez vos premiers livrables, exports ou documents partagés."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              id={file.id}
              label={file.label}
              storageProvider={file.storageProvider}
              createdAt={file.createdAt}
              projectName={file.projectName}
              canDelete={file.canDelete && canManage}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadPlaceholderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8m0 0l-3 3m3-3l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0012.586 10H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );
}

