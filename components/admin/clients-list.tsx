"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserX, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { DemoUrlDialog } from "./demo-url-dialog";

interface Client {
  id: string;
  fullName: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  role: "prospect" | "client";
  projectCount: number;
  firstProject: {
    id: string;
    name: string;
    demoUrl: string | null;
    status: string;
  } | null;
  createdAt: string | null;
}

interface ClientsListProps {
  clients: Client[];
}

export function ClientsList({ clients }: ClientsListProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filtrer les clients par prénom/nom
  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return clients;
    }
    const query = searchQuery.toLowerCase().trim();
    return clients.filter((client) => {
      const fullName = client.fullName?.toLowerCase() ?? "";
      const company = client.company?.toLowerCase() ?? "";
      const email = client.email?.toLowerCase() ?? "";
      return fullName.includes(query) || company.includes(query) || email.includes(query);
    });
  }, [clients, searchQuery]);

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

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <Card className="border border-border/70">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par prénom, nom, entreprise ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filteredClients.length === 0 ? (
        <Card className="border border-border/70">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "Aucun résultat trouvé." : "Aucun client ou prospect trouvé."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
        const isUpdating = updatingId === client.id;
        const displayName = client.fullName || client.company || client.email || "Client sans nom";

        return (
          <Card key={client.id} className="border border-border/70">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{displayName}</CardTitle>
                  <CardDescription className="truncate">{client.email}</CardDescription>
                  {client.phone && (
                    <CardDescription className="truncate text-xs mt-0.5">{client.phone}</CardDescription>
                  )}
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

              <div className="space-y-2">
                {client.role === "prospect" && client.firstProject && (
                  <DemoUrlDialog
                    projectId={client.firstProject.id}
                    projectName={client.firstProject.name}
                    currentDemoUrl={client.firstProject.demoUrl}
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        variant={client.firstProject.demoUrl ? "default" : "outline"}
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {client.firstProject.demoUrl ? "Modifier la démo" : "Ajouter la démo"}
                      </Button>
                    }
                  />
                )}
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
              </div>
            </CardContent>
          </Card>
        );
      })}
        </div>
      )}
    </div>
  );
}

