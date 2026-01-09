import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, salesCalls, authUsers, quotes, projects, prospectNotes, tasks, calendarEvents } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { TaskList } from "@/components/sales/tasks/task-list";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Mail, Globe, Calendar, Clock, FileText, CheckCircle2, MoreHorizontal, History } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { QuickActions } from "@/components/sales/quick-actions";
import { ProspectNotes } from "@/components/sales/prospect-notes";
import { ProspectMenu } from "@/components/sales/prospect-menu";
import { AdminQuoteButton } from "@/components/sales/admin-quote-button";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    "new": { label: "Nouveau", variant: "default" },
    "contacted": { label: "Contacté", variant: "secondary" },
    "meeting": { label: "RDV", variant: "outline" },
    "proposal": { label: "Proposition", variant: "secondary" },
    "won": { label: "Gagné", variant: "default" }, // Using default (black/primary) for won if success doesn't exist, or keep consistency
    "lost": { label: "Perdu", variant: "destructive" },
    // Fallback/Legacy
    "demo_sent": { label: "Démo envoyée", variant: "secondary" },
    "offer_sent": { label: "Offre envoyée", variant: "secondary" },
    "negotiation": { label: "Négociation", variant: "secondary" },
};

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;

    const [prospect, prospectEmail] = await Promise.all([
        db.query.profiles.findFirst({
            where: eq(profiles.id, id),
        }),
        db.query.authUsers.findFirst({
            where: eq(authUsers.id, id),
            columns: { email: true }
        })
    ]);

    if (!prospect || (prospect.role !== "prospect" && prospect.role !== "client")) {
        notFound();
    }

    // Fetch related data
    const existingCalls = await db.query.salesCalls.findMany({
        where: eq(salesCalls.prospectId, prospect.id),
        orderBy: [desc(salesCalls.createdAt)],
    });

    // Fetch projects to get quotes (quotes are linked to projects, not profiles directly)
    const prospectProjects = await db.query.projects.findMany({
        where: eq(projects.ownerId, prospect.id),
    });

    const projectIds = prospectProjects.map(p => p.id);

    const prospectQuotes = projectIds.length > 0 ? await db.query.quotes.findMany({
        where: inArray(quotes.projectId, projectIds),
        limit: 5,
    }) : [];

    const status = statusMap[prospect.prospectStatus] || { label: prospect.prospectStatus, variant: "outline" };

    // 1. Fetch User Notes
    const notesQuery = await db.query.prospectNotes.findMany({
        where: eq(prospectNotes.prospectId, prospect.id),
        with: { author: true }
    });

    const userNotes = notesQuery.map(note => ({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        type: (note.type || "note") as "note" | "call" | "email" | "meeting",
        author: note.author ? { name: note.author.fullName, image: null } : null,
        isSystem: false
    }));

    // 2. Fetch Real Calendar Events
    const { calendarEvents } = await import("@/lib/schema");
    const prospectEvents = await db.query.calendarEvents.findMany({
        where: eq(calendarEvents.prospectId, prospect.id),
        with: { createdBy: true },
        orderBy: [desc(calendarEvents.startTime)]
    });

    const upcomingEvents = prospectEvents
        .filter(e => e.status !== "cancelled" && new Date(e.startTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const nextEvent = upcomingEvents[0];

    // 2. Fetch System Events (Calls Logged automatically, Meetings, etc)
    const systemEvents: any[] = [];

    // Event: Creation
    systemEvents.push({
        id: "sys_create",
        type: "system_create",
        content: "Prospect créé dans le système",
        createdAt: prospect.createdAt,
        author: { name: "Système", image: null },
        isSystem: true
    });

    // Event: Calendar Meetings
    prospectEvents.forEach(event => {
        systemEvents.push({
            id: `sys_event_${event.id}`,
            type: "system_meeting",
            content: `${event.title} (${event.type})`,
            createdAt: event.createdAt, // Or startTime if we want it to appear when it happens
            author: event.createdBy ? { name: event.createdBy.fullName, image: null } : { name: "Système", image: null },
            isSystem: true,
            metadata: {
                startTime: event.startTime,
                status: event.status
            }
        });
    });

    // Event: Sales Calls (Legacy calls table)
    const historyCalls = await db.query.salesCalls.findMany({
        where: eq(salesCalls.prospectId, prospect.id)
    });

    historyCalls.forEach(call => {
        systemEvents.push({
            id: `sys_call_${call.id}`,
            type: "call",
            content: "Appel téléphonique enregistré (Legacy)",
            createdAt: call.createdAt,
            author: { name: "Système", image: null },
            isSystem: true
        });
    });

    // Merge and Sort
    const allActivities = [...userNotes, ...systemEvents].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 4. Fetch Tasks
    const prospectTasksQuery = await db.query.tasks.findMany({
        where: eq(tasks.prospectId, prospect.id),
        orderBy: [desc(tasks.createdAt)],
    });

    const prospectTasks = prospectTasksQuery.map(t => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null
    }));

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] -m-6 p-6 space-y-6 overflow-hidden">
            {/* 1. Header: Identity & Quick Actions */}
            <header className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href={"/dashboard/list" as any}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${prospect.fullName}`} />
                            <AvatarFallback>{prospect.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold">{prospect.fullName}</h1>
                                <Badge variant={status.variant as any} className="capitalize">
                                    {status.label}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                {prospect.company || "Entreprise inconnue"}
                                {prospect.company ? <span>•</span> : null}
                                <span className="text-xs">Ajouté le {formatDate(prospect.createdAt)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <QuickActions
                        phone={prospect.phone}
                        email={prospectEmail?.email}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    />
                    <ProspectMenu
                        id={prospect.id}
                        initialData={{
                            fullName: prospect.fullName,
                            company: prospect.company,
                            phone: prospect.phone
                        }}
                    />
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">

                {/* 2. Left Column: Context Card (3 cols) */}
                <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-1">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Coordonnées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-muted-foreground text-xs">Email</p>
                                    <p className="font-medium truncate" title={prospectEmail?.email || ""}>
                                        {prospectEmail?.email || "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Téléphone</p>
                                    <p className="font-medium">{prospect.phone || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                    <Globe className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Site Web</p>
                                    <p className="font-medium">-</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Infos Qualification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Source</p>
                                <Badge variant="secondary">Inbound</Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Budget Estimé</p>
                                <p className="font-medium">-</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Dernière activité</p>
                                <p className="font-medium">Aujourd'hui</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Center Column: Activity Feed (6 cols) */}
                <div className="col-span-6 flex flex-col min-h-0 bg-background rounded-xl border">
                    <Tabs defaultValue="activities" className="flex flex-col h-full">
                        <div className="border-b px-4 py-2">
                            <TabsList className="bg-transparent w-full justify-start h-10 p-0">
                                <TabsTrigger value="activities" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    Activités
                                </TabsTrigger>
                                <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    Tâches
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
                            <TabsContent value="activities" className="mt-4 flex-1 min-h-0 flex flex-col">
                                <Card className="flex-1 flex flex-col">
                                    <CardHeader>
                                        <CardTitle>Journal d'activités</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 min-h-0 overflow-hidden">
                                        {/* @ts-ignore */}
                                        <ProspectNotes id={prospect.id} notes={allActivities} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="tasks" className="mt-0 h-full">
                                <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
                                    <div className="h-full">
                                        <TaskList prospectId={prospect.id} initialTasks={prospectTasks} />
                                    </div>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* 4. Right Column: Next Steps & Docs (3 cols) */}
                <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pl-1">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2 text-primary">
                                <Calendar className="h-4 w-4" />
                                Prochaine étape
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {nextEvent ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium truncate">{nextEvent.title}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(nextEvent.startTime)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(nextEvent.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(nextEvent.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <Button size="sm" className="w-full" variant="outline" asChild>
                                        <Link href="/dashboard/agenda">
                                            Voir dans l'agenda
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Aucune action planifiée</p>
                                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                                        <Link href={"/dashboard/agenda" as any}>
                                            Planifier une action
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {prospectQuotes.length > 0 ? (
                                prospectQuotes.map(q => (
                                    <div key={q.id} className="flex items-center justify-between p-2 rounded-md border text-sm">
                                        <span>Devis #{q.number || "?"}</span>
                                        <Badge variant="outline" className="text-[10px]">{q.status}</Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">Aucun document</p>
                            )}
                            <AdminQuoteButton
                                projectId={prospectProjects[0]?.id}
                                prospectName={prospect.fullName || "le prospect"}
                            />
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
