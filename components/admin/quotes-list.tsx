"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, CheckCircle2, Clock, XCircle, Trash2, Loader2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Quote {
  id: string;
  projectId: string;
  projectName: string;
  pdfUrl: string;
  signedPdfUrl: string | null;
  status: "pending" | "signed" | "cancelled";
  signedAt: string | null;
  createdAt: string | null;
  prospectName: string;
  prospectEmail: string;
  company: string | null;
}

interface QuotesListProps {
  quotes: Quote[];
}

const statusConfig = {
  pending: {
    label: "En attente",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-yellow-600"
  },
  signed: {
    label: "Signé",
    icon: CheckCircle2,
    variant: "default" as const,
    color: "text-green-600"
  },
  cancelled: {
    label: "Annulé",
    icon: XCircle,
    variant: "outline" as const,
    color: "text-red-600"
  }
};

export function QuotesList({ quotes }: QuotesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (quoteId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      return;
    }

    setDeletingId(quoteId);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Devis supprimé");
      router.refresh();
    } catch (error) {
      toast.error("Impossible de supprimer le devis");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun devis pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => {
        const status = statusConfig[quote.status];
        const StatusIcon = status.icon;
        const isDeleting = deletingId === quote.id;

        return (
          <Card key={quote.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{quote.projectName}</CardTitle>
                    <Badge variant={status.variant} className={cn("shrink-0", status.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <CardDescription className="space-y-1">
                    <div>
                      <strong>Prospect:</strong> {quote.prospectName}
                      {quote.company && ` (${quote.company})`}
                    </div>
                    <div>
                      <strong>Email:</strong> {quote.prospectEmail}
                    </div>
                    {quote.createdAt && (
                      <div>
                        <strong>Créé le:</strong>{" "}
                        {formatDate(quote.createdAt, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    )}
                    {quote.signedAt && (
                      <div className="text-green-600 font-medium">
                        <strong>Signé le:</strong>{" "}
                        {formatDate(quote.signedAt, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-600"
                  onClick={() => handleDelete(quote.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-sm"
                >
                  <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    Voir le devis
                  </a>
                </Button>
                {quote.signedPdfUrl && (
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="text-sm"
                  >
                    <a href={quote.signedPdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le devis signé
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

