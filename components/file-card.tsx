'use client';

import * as React from "react";
import { Download, ExternalLink, FileArchive, FileText, Image, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate, getFileKindIcon } from "@/lib/utils";

export interface FileCardProps {
  id: string;
  label: string;
  storageProvider: string;
  createdAt?: string | Date | null;
  projectName: string;
  canDelete: boolean;
  url: string;
  onDelete: (fileId: string) => Promise<void>;
}

const emojiMap: Record<string, string> = {
  image: "🖼️",
  archive: "🗂️",
  doc: "📄",
  pdf: "📄"
};

export function FileCard({
  id,
  label,
  storageProvider,
  createdAt,
  projectName,
  canDelete,
  url,
  onDelete
}: FileCardProps) {
  const [isDeleting, setDeleting] = React.useState(false);

  const iconKey = getFileKindIcon(label.toLowerCase());
  const emoji = emojiMap[iconKey] ?? "📄";

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      setDeleting(true);
      await onDelete(id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="group flex h-full flex-col justify-between border border-border/70 bg-white/90 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2 pb-3 sm:gap-3">
        <div className="space-y-1.5 flex-1 min-w-0 sm:space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xl sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
              {emoji}
            </span>
            <div className="flex-1 min-w-0">
              <CardTitle className="line-clamp-2 text-sm font-semibold sm:text-base">{label}</CardTitle>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs mt-0.5">{projectName}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground sm:text-xs">
            Stockage : <span className="font-medium">{storageProvider}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-[44px] w-[44px] p-0 opacity-0 transition-opacity group-hover:opacity-100 sm:h-auto sm:w-auto sm:p-2"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir dans un nouvel onglet">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-[44px] text-xs sm:text-sm"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <Download className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Télécharger</span>
              <span className="sm:hidden">DL</span>
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-[10px] text-muted-foreground sm:text-xs">
        <span>
          Ajouté le {formatDate(createdAt, { dateStyle: "medium", timeStyle: "short" })}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="min-h-[44px] text-destructive text-xs sm:text-sm"
          onClick={handleDelete}
          disabled={!canDelete || isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
          ) : (
            <>
              <Trash2 className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Supprimer</span>
              <span className="sm:hidden">Suppr.</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

