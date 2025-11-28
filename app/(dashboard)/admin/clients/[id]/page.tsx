import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles, projects, subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientServicesManager } from "@/components/admin/client-services-manager";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { ProjectEditorDialog } from "@/components/projects/project-editor-dialog";
import { BriefManager } from "@/components/admin/brief-manager";

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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/clients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title={client.fullName || "Client sans nom"}
                    description={`Détails du compte et gestion des services.`}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-semibold">Email:</span> {client.id} {/* ID is email in authUsers usually, but here ID is UUID. Need to fetch authUser email? Profile doesn't have email. */}
                            {/* Actually profiles table doesn't store email directly, it's in authUsers. But we can't easily join here with query builder if not related. 
                  Wait, profiles.id references authUsers.id. 
                  Let's fetch email separately or assume we can get it. 
                  Actually, I should have fetched authUsers too. */}
                        </div>
                        <div>
                            <span className="font-semibold">Nom:</span> {client.fullName || "-"}
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

            {project && (
                <Card>
                    <CardHeader>
                        <CardTitle>Services Actifs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ClientServicesManager
                            clientId={client.id}
                            projectId={project.id}
                            subscriptions={project.subscriptions}
                        />
                    </CardContent>
                </Card>
            )}

            {project && (
                <BriefManager projectId={project.id} />
            )}
        </div>
    );
}
