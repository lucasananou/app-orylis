import { redirect } from "next/navigation";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, tickets, profiles, projects } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Ticket, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

async function loadAdminStats() {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        redirect("/");
    }

    const [pendingQuotesCount, openTicketsCount, referredClientsCount, activeProjects] = await Promise.all([
        db
            .select({ count: sql<number>`count(*)` })
            .from(quotes)
            .where(eq(quotes.status, "pending"))
            .then((res) => Number(res[0]?.count ?? 0)),
        db
            .select({ count: sql<number>`count(*)` })
            .from(tickets)
            .where(eq(tickets.status, "open"))
            .then((res) => Number(res[0]?.count ?? 0)),
        db
            .select({ count: sql<number>`count(*)` })
            .from(profiles)
            .where(and(eq(profiles.role, "client"), isNotNull(profiles.referrerId)))
            .then((res) => Number(res[0]?.count ?? 0)),
        db.query.projects.findMany({
            where: (projects, { ne }) => ne(projects.status, "delivered"),
            with: {
                owner: {
                    columns: { fullName: true }
                }
            },
            orderBy: (projects, { desc }) => [desc(projects.createdAt)],
            limit: 5
        })
    ]);

    return {
        pendingQuotesCount,
        openTicketsCount,
        referredClientsCount,
        activeProjects
    };
}

export default async function AdminDashboardPage() {
    const { pendingQuotesCount, openTicketsCount, referredClientsCount, activeProjects } = await loadAdminStats();

    return (
        <div className="p-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Devis en attente</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingQuotesCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets ouverts</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openTicketsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients parrainés</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{referredClientsCount}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Projets en cours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeProjects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucun projet en cours.</p>
                            ) : (
                                activeProjects.map((project) => (
                                    <div key={project.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium">{project.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {project.owner?.fullName} • {project.status}
                                            </p>
                                        </div>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/projects/${project.id}`}>
                                                Voir
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Accès Directs</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Link href="/admin/clients" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                            <span className="font-medium">Gérer les clients & prospects</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link href="/admin/quotes" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                            <span className="font-medium">Suivre les devis</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link href="/tickets" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                            <span className="font-medium">Voir tous les tickets</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
