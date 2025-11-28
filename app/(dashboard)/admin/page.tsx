import { redirect } from "next/navigation";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, tickets, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Ticket, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

async function loadAdminStats() {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        redirect("/");
    }

    const [pendingQuotesCount, openTicketsCount, referredClientsCount] = await Promise.all([
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
            .then((res) => Number(res[0]?.count ?? 0))
    ]);

    return {
        pendingQuotesCount,
        openTicketsCount,
        referredClientsCount
    };
}

export default async function AdminDashboardPage() {
    const { pendingQuotesCount, openTicketsCount, referredClientsCount } = await loadAdminStats();

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

            <div className="grid gap-4 md:grid-cols-2">
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
