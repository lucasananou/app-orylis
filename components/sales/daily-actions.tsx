"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Calendar, CheckSquare, Clock, MapPin, Video, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTask } from "@/actions/tasks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DailyActionsProps {
    events: any[];
    tasks: any[];
}

export function DailyActions({ events, tasks }: DailyActionsProps) {
    const router = useRouter();

    const handleTaskToggle = async (id: string, checked: boolean) => {
        try {
            await toggleTask(id, checked);
            toast.success(checked ? "Tâche terminée" : "Tâche rouverte");
            router.refresh(); // Refresh to update the list
        } catch (error) {
            toast.error("Erreur");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Today's Meetings */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="py-3 px-4 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Rendez-vous Aujourd'hui
                        <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                            {events.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2 space-y-2">
                    {events.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 italic">Aucun rendez-vous aujourd'hui</p>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border">
                                <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 h-10 w-10 rounded shrink-0">
                                    <span className="text-[10px] font-bold leading-none">
                                        {formatDate(event.startTime, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{event.title}</p>
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        {event.prospect?.fullName || "Prospect inconnu"}
                                        {event.meetingUrl ? (
                                            <Video className="h-3 w-3 ml-1 opacity-70" />
                                        ) : (
                                            <MapPin className="h-3 w-3 ml-1 opacity-70" />
                                        )}
                                    </p>
                                </div>
                                <Link href={`/prospects/${event.prospectId}`} className="text-xs text-primary hover:underline self-center">
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Critical Tasks */}
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="py-3 px-4 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-amber-500" />
                        Tâches Prioritaires
                        <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                            {tasks.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2 space-y-2">
                    {tasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 italic">Aucune tâche urgente</p>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border">
                                <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={(c) => handleTaskToggle(task.id, c as boolean)}
                                    className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                    <span className={cn(
                                        "text-sm block truncate",
                                        task.completed && "line-through text-muted-foreground"
                                    )}>
                                        {task.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] h-4 px-1 border-0",
                                            task.priority === 'high' ? "text-red-500 bg-red-50" : "text-amber-500 bg-amber-50"
                                        )}>
                                            {task.priority === 'high' ? 'Urgent' : 'Normal'}
                                        </Badge>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                            <Clock className="h-3 w-3" />
                                            {task.dueDate ? formatDate(task.dueDate) : "Pas de date"}
                                        </p>
                                    </div>
                                </div>
                                <Link href={`/prospects/${task.prospectId}`} className="text-xs text-muted-foreground hover:text-primary self-center">
                                    {task.prospect?.fullName}
                                </Link>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
