"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface Client {
  id: string;
  fullName: string | null;
  company: string | null;
  email: string | null;
  role: "prospect" | "client";
  projectCount: number;
  createdAt: string | null;
}

interface ClientsListProps {
  clients: Client[];
}

export function ClientsList({ clients }: ClientsListProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleRoleChange = async (clientId: string, newRole: "prospect" | "client") => {
    setUpdatingId(clientId);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Impossible de mettre à jour le rôle.");
      }

      toast.success(
        newRole === "client"
          ? "Prospect promu en client avec succès."
          : "Client rétrogradé en prospect."
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue.";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (clients.length === 0) {
    return (
      <Card className="border border-border/70">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Aucun client ou prospect trouvé.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => {
        const isUpdating = updatingId === client.id;
        const displayName = client.fullName || client.company || client.email || "Client sans nom";

        return (
          <Card key={client.id} className="border border-border/70">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{displayName}</CardTitle>
                  <CardDescription className="truncate">{client.email}</CardDescription>
                </div>
                <Badge variant={client.role === "client" ? "default" : "secondary"}>
                  {client.role === "client" ? "Client" : "Prospect"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>{client.projectCount} projet{client.projectCount > 1 ? "s" : ""}</p>
                {client.createdAt && (
                  <p>Créé le {formatDate(client.createdAt, { dateStyle: "medium" })}</p>
                )}
              </div>

              <div className="flex gap-2">
                {client.role === "prospect" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleRoleChange(client.id, "client")}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mise à jour…
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Promouvoir en client
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRoleChange(client.id, "prospect")}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mise à jour…
                      </>
                    ) : (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Rétrograder en prospect
                      </>
                    )}
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

