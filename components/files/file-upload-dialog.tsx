"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectOption {
  id: string;
  name: string;
}

interface FileUploadDialogProps {
  projectId: string;
  projects: ProjectOption[];
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
  "application/zip": [".zip"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
};

export function FileUploadDialog({ projectId, projects, disabled }: FileUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (disabled) {
      toast.error("Aucun projet disponible pour l’upload.");
      return;
    }
    setOpen(true);
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!projectId) {
      toast.error("Aucun projet sélectionné.");
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(ACCEPTED_TYPES, file.type)) {
      toast.error("Ce format de fichier n'est pas supporté.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier dépasse 10 Mo.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("file", file, file.name);

      const response = await fetch("/api/files/signed-url", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Impossible d'uploader le fichier.");
      }

      toast.success("📁 Fichier ajouté avec succès.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'upload.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpen} disabled={disabled}>
          <Upload className="mr-2 h-4 w-4" />
          Uploader un fichier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>
            Formats autorisés : PNG, JPG, PDF, ZIP, DOCX (10 Mo max). Les fichiers seront liés au projet sélectionné.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border/60 bg-gradient-to-br from-muted/60 to-muted/40 hover:border-accent/40 hover:bg-muted/70"
            )}
          >
            <p className="text-sm text-muted-foreground">
              Projet sélectionné :{" "}
              <span className="font-medium text-foreground">
                {projects.find((p) => p.id === projectId)?.name ?? "—"}
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              {isDragging
                ? "Lâchez le fichier ici"
                : "Glissez-déposez un fichier ou cliquez sur le bouton ci-dessous"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={Object.values(ACCEPTED_TYPES)
                .flat()
                .join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              className="mt-4"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload en cours…
                </>
              ) : (
                "Choisir un fichier"
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isUploading}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


