import { redirect } from "next/navigation";
import { eq, sql, and, isNotNull, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, tickets, profiles, projects, invoices } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Ticket, Users, ArrowRight, ReceiptEuro, Clock, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecentActivity, ActivityItem } from "@/components/admin/recent-activity";

export const revalidate = 0;

async function loadAdminStats() {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        redirect("/");
    }

    const [
        paidRevenue,
        pendingRevenue,
        prospectStats,
        lastTickets,
        lastProspects,
        lastQuotes,
        lastInvoices
    ] = await Promise.all([
        // CA Encaissé
        db.select({ total: sql<number>`sum(${invoices.amount})` })
            .from(invoices)
            .where(eq(invoices.status, "paid"))
            .then(res => (res[0]?.total ?? 0) / 100),

        // CA En attente
        db.select({ total: sql<number>`sum(${invoices.amount})` })
            .from(invoices)
            .where(eq(invoices.status, "pending"))
            .then(res => (res[0]?.total ?? 0) / 100),

        // Stats Prospects
        db.select({
            status: profiles.prospectStatus,
            count: sql<number>`count(*)`
        })
            .from(profiles)
            .where(eq(profiles.role, "prospect"))
            .groupBy(profiles.prospectStatus),

        // Recent Tickets
        db.query.tickets.findMany({
            orderBy: (t, { desc }) => [desc(t.createdAt)],
            limit: 5,
            with: { author: true }
        }),

        // Recent Prospects
        db.query.profiles.findMany({
            where: (p, { eq }) => eq(p.role, "prospect"),
            orderBy: (p, { desc }) => [desc(p.createdAt)],
            limit: 5
        }),

        // Recent Signed Quotes
        db.query.quotes.findMany({
            where: (q, { eq }) => eq(q.status, "signed"),
            orderBy: (q, { desc }) => [desc(q.signedAt)],
            limit: 5,
            with: { project: true }
        }),

        // Recent Paid Invoices
        db.query.invoices.findMany({
            where: (i, { eq }) => eq(i.status, "paid"),
            orderBy: (i, { desc }) => [desc(i.createdAt)], // utilizing createdAt as payment approximation or created
            limit: 5,
            with: { user: true }
        })
    ]);

    // Aggregate Activity
    const activities: ActivityItem[] = [
        ...lastTickets.map(t => ({
            id: t.id,
            type: "ticket_created" as const,
            title: `Nouveau ticket : ${t.title}`,
            description: `${t.author.fullName} a ouvert un ticket.`,
            timestamp: t.createdAt.toISOString()
        })),
        ...lastProspects.map(p => ({
            id: p.id,
            type: "prospect_registered" as const,
            title: `Nouveau prospect : ${p.fullName}`,
            description: p.company || "Inscription via le site",
            timestamp: p.createdAt!.toISOString()
        })),
        ...lastQuotes.map(q => ({
            id: q.id,
            type: "quote_signed" as const,
            title: "Devis signé !",
            description: `Projet: ${q.project.name}`,
            timestamp: q.signedAt!.toISOString()
        })),
        ...lastInvoices.map(i => ({
            id: i.id,
            type: "invoice_paid" as const,
            title: `Facture réglée : ${(i.amount / 100).toFixed(2)}€`,
            description: `Client: ${i.user.fullName}`,
            timestamp: i.createdAt.toISOString()
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    const prospectCounts = {
        new: 0,
        negotiation: 0,
        signed: 0
    };

    prospectStats.forEach(stat => {
        if (stat.status === "new" || stat.status === "contacted") prospectCounts.new += Number(stat.count);
        if (stat.status === "negotiation" || stat.status === "offer_sent") prospectCounts.negotiation += Number(stat.count);
        // Assuming 'signed' logic means converted to client? Or use a specific status. 
        // For now, let's just count based on status enum usage.
    });

    return {
        paidRevenue,
        pendingRevenue,
        prospectCounts,
        activities
    };
}

export default async function AdminDashboardPage() {
    const { paidRevenue, pendingRevenue, prospectCounts, activities } = await loadAdminStats();

    return (
        <div className="p-8 space-y-8">
            {/* Top Stats - Revenue & Prospects */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trésorerie (Encaissé)</CardTitle>
                        <ReceiptEuro className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(paidRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Total factures payées</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-400 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
                        <Clock className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(pendingRevenue)}</div>
                        <p className="text-xs text-muted-foreground">À relancer</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline : Nouveaux</CardTitle>
                        <UserPlus className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{prospectCounts.new}</div>
                        <p className="text-xs text-muted-foreground">Prospects à contacter</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline : En négo</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{prospectCounts.negotiation}</div>
                        <p className="text-xs text-muted-foreground">Offres envoyées / discussions</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Recent Activity Feed */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Fil d&apos;actualité
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentActivity activities={activities} />
                    </CardContent>
                </Card>

                {/* Quick Actions / Navigation */}
                <Card className="shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle>Accès Rapide</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                            <Link href={"/admin/prospects" as any}>
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold">Prospects CRM</span>
                                    <span className="text-xs text-muted-foreground">Gérer le pipeline</span>
                                </div>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                            <Link href="/admin/invoices">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold">Facturation</span>
                                    <span className="text-xs text-muted-foreground">Suivre les paiements</span>
                                </div>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                            <Link href="/tickets">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold">Support & Tickets</span>
                                    <span className="text-xs text-muted-foreground">Voir les demandes</span>
                                </div>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
