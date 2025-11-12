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
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-2xl">
              {emoji}
            </span>
            <div className="flex-1 min-w-0">
              <CardTitle className="line-clamp-1 text-base font-semibold">{label}</CardTitle>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{projectName}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Stockage : <span className="font-medium">{storageProvider}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 transition-opacity group-hover:opacity-100"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir dans un nouvel onglet">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-xs text-muted-foreground/80">
        <span>
          Ajouté le {formatDate(createdAt, { dateStyle: "medium", timeStyle: "short" })}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={handleDelete}
          disabled={!canDelete || isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

