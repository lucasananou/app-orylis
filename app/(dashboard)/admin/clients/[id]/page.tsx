import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles, projects, subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, Calendar } from "lucide-react";
import { ProjectEditorDialog } from "@/components/projects/project-editor-dialog";
import { ClientNotes } from "@/components/admin/client-notes";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { generateAdminQuote } from "@/actions/admin/quotes";
import { QuoteButton } from "../../../../../components/admin/quote-button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) {
        redirect("/");
    }

    const { id } = await params;

    // Fetch client profile
    const client = await db.query.profiles.findFirst({
        where: eq(profiles.id, id),
        with: {
            authUser: true,
            tickets: {
                orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
                limit: 1
            },
            projects: {
                with: {
                    subscriptions: true
                }
            }
        }
    });

    if (!client) {
        return <div>Client introuvable</div>;
    }

    const project = client.projects[0]; // Assume 1 project for MVP
    const lastTicket = client.tickets[0];
    const clientName = client.fullName || client.authUser?.name || client.authUser?.email?.split('@')[0] || "Client sans nom";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/clients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title={clientName}
                    description={`Détails du compte et gestion des services.`}
                />
                <div className="ml-auto flex items-center gap-2">
                    {project && (
                        <QuoteButton projectId={project.id} />
                    )}
                    <ImpersonateButton userId={client.id} userName={clientName} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-semibold">Email:</span> {client.authUser?.email || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Nom:</span> {client.fullName || client.authUser?.name || client.authUser?.email?.split('@')[0] || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Entreprise:</span> {client.company || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Téléphone:</span> {client.phone || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Rôle:</span> <Badge>{client.role}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {project && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-semibold">Projet Principal</CardTitle>
                            <ProjectEditorDialog
                                mode="edit"
                                owners={[{ id: client.id, name: client.fullName || "Client" }]}
                                project={{
                                    id: project.id,
                                    name: project.name,
                                    status: project.status,
                                    progress: project.progress,
                                    dueDate: project.dueDate,
                                    ownerId: project.ownerId,
                                    demoUrl: project.demoUrl,
                                    googlePropertyId: project.googlePropertyId,
                                    hostingExpiresAt: project.hostingExpiresAt ? project.hostingExpiresAt.toISOString() : null,
                                    maintenanceActive: project.maintenanceActive,
                                    deliveredAt: project.deliveredAt ? project.deliveredAt.toISOString() : null
                                }}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Gérer le projet
                                    </Button>
                                }
                            />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <span className="font-semibold">Nom:</span> {project.name}
                            </div>
                            <div>
                                <span className="font-semibold">Statut:</span> <Badge variant="outline">{project.status}</Badge>
                            </div>
                            <div>
                                <span className="font-semibold">Démo:</span>{" "}
                                {project.demoUrl ? (
                                    <a href={project.demoUrl} target="_blank" className="text-blue-600 hover:underline">
                                        Voir le site
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <ClientNotes clientId={client.id} initialNotes={client.internalNotes} />

                <Card>
                    <CardHeader>
                        <CardTitle>Activité Récente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Inscription</span>
                            </div>
                            <span className="text-sm font-medium">
                                {client.createdAt ? format(new Date(client.createdAt), 'd MMM yyyy', { locale: fr }) : "-"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Dernier ticket</span>
                            </div>
                            <span className="text-sm font-medium">
                                {lastTicket ? format(new Date(lastTicket.createdAt), 'd MMM yyyy', { locale: fr }) : "Aucun ticket"}
                            </span>
                        </div>
                        {/* More stats can go here */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
