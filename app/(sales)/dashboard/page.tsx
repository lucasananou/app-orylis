import { auth } from "@/auth";
import { getSalesData } from "@/actions/data-fetching";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, TrendingUp, CalendarCheck } from "lucide-react";
import { KanbanBoard } from "@/components/sales/kanban-board";
import { DailyActions } from "@/components/sales/daily-actions";
import { db } from "@/lib/db";
import { calendarEvents, tasks } from "@/lib/schema";
import { and, eq, gte, lte, asc, or } from "drizzle-orm";

export default async function SalesDashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    const { prospects, clients } = await getSalesData();

    // Calculate statistics
    const totalProspects = prospects.length;
    const prospectsWithMeetings = prospects.filter(p => p.meetingBookedAt).length;
    const totalClients = clients.length;
    const conversionRate = totalProspects > 0 ? ((totalClients / (totalProspects + totalClients)) * 100).toFixed(1) : "0";

    // Fetch Daily Actions Data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Today's Events
    const todayEvents = await db.query.calendarEvents.findMany({
        where: and(
            gte(calendarEvents.startTime, today),
            lte(calendarEvents.startTime, tomorrow),
            eq(calendarEvents.status, "scheduled")
        ),
        with: { prospect: true },
        orderBy: [asc(calendarEvents.startTime)],
        limit: 5
    });

    // 2. Pending Tasks (Due today or overdue)
    const pendingTasks = await db.query.tasks.findMany({
        where: and(
            eq(tasks.completed, false),
            or(
                lte(tasks.dueDate, tomorrow), // Due before tomorrow (includes today & overdue)
                eq(tasks.priority, "high") // Or high priority regardless of date
            )
        ),
        with: { prospect: true },
        orderBy: [asc(tasks.dueDate), asc(tasks.priority)],
        limit: 5
    });

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Pipeline Commercial</h1>
            </div>

            <DailyActions events={todayEvents} tasks={pendingTasks} />

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProspects}</div>
                        <p className="text-xs text-muted-foreground">
                            Prospects actifs
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">RDV Programmés</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{prospectsWithMeetings}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalProspects > 0 ? `${((prospectsWithMeetings / totalProspects) * 100).toFixed(0)}% des prospects` : ""}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClients}</div>
                        <p className="text-xs text-muted-foreground">
                            Clients convertis
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{conversionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            Prospects → Clients
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 min-h-0">
                <div className="h-[calc(100vh-220px)]">
                    <KanbanBoard initialProspects={prospects} />
                </div>
            </div>
        </div>
    );
}
