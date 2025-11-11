'use client';

import * as React from "react";
import { Download, FileArchive, FileText, Image, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getFileKindIcon } from "@/lib/utils";

export interface FileCardProps {
  id: string;
  label: string;
  storageProvider: string;
  createdAt?: string | Date | null;
  projectName: string;
  canDelete: boolean;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
}

const iconMap: Record<string, React.ReactNode> = {
  image: <Image className="h-5 w-5 text-accent" aria-hidden />,
  archive: <FileArchive className="h-5 w-5 text-accent" aria-hidden />,
  doc: <FileText className="h-5 w-5 text-accent" aria-hidden />,
  pdf: <FileText className="h-5 w-5 text-accent" aria-hidden />
};

export function FileCard({
  id,
  label,
  storageProvider,
  createdAt,
  projectName,
  canDelete,
  onDownload,
  onDelete
}: FileCardProps) {
  const [isDownloading, setDownloading] = React.useState(false);
  const [isDeleting, setDeleting] = React.useState(false);

  const iconKey = getFileKindIcon(label.toLowerCase());
  const icon = iconMap[iconKey] ?? iconMap.doc;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await onDownload(id);
    } finally {
      setDownloading(false);
    }
  };

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
    <Card className="flex h-full flex-col justify-between border border-border/70 bg-white/90">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10">
              {icon}
            </span>
            <div>
              <CardTitle className="line-clamp-1 text-base font-semibold">{label}</CardTitle>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{projectName}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Stockage : <span className="font-medium">{storageProvider}</span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </>
          )}
        </Button>
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

