"use client";

import { signIn } from "next-auth/react";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Video, MoreHorizontal, Link as LinkIcon, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventDetailsDialog } from "./event-details-dialog";
import { EventDialog } from "./event-dialog";
import { EventQuickActions } from "./event-quick-actions";

export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    type: "demo" | "followup" | "closing" | "support" | "other";
    status: "scheduled" | "completed" | "cancelled" | "no_show";
    meetingUrl: string | null;
    location: string | null;
    prospect: {
        id: string;
        fullName: string | null;
        company: string | null;
    };
    createdById: string;
}

interface MeetingsCalendarProps {
    events: CalendarEvent[];
    prospects?: { id: string; fullName: string | null; company: string | null; }[];
}

export function MeetingsCalendar({ events, prospects = [] }: MeetingsCalendarProps) {
    const [view, setView] = useState<"month" | "week" | "day">("month");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [showNewEventDialog, setShowNewEventDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Filter active events (not cancelled)
    const activeEvents = useMemo(() => {
        return events.filter(e => e.status !== "cancelled");
    }, [events]);

    // Generate days for the grid
    const days = useMemo(() => {
        if (view === "month") {
            const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }); // Monday start
            const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        } else if (view === "week") {
            const start = startOfWeek(currentMonth, { weekStartsOn: 1 });
            const end = endOfWeek(currentMonth, { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        } else { // day view
            return [currentMonth];
        }
    }, [currentMonth, view]);

    // Get events for the selected date
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return activeEvents.filter(e =>
            isSameDay(new Date(e.startTime), selectedDate)
        ).sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    }, [activeEvents, selectedDate]);

    // Helper to get events for a specific day in the grid
    const getDayEvents = (day: Date) => {
        return activeEvents.filter(e =>
            isSameDay(new Date(e.startTime), day)
        );
    };

    const nextPeriod = () => {
        if (view === "month") setCurrentMonth(addMonths(currentMonth, 1));
        if (view === "week") setCurrentMonth(startOfWeek(new Date(currentMonth.setDate(currentMonth.getDate() + 7)), { weekStartsOn: 1 }));
        if (view === "day") setCurrentMonth(new Date(currentMonth.setDate(currentMonth.getDate() + 1)));
    };

    const prevPeriod = () => {
        if (view === "month") setCurrentMonth(subMonths(currentMonth, 1));
        if (view === "week") setCurrentMonth(startOfWeek(new Date(currentMonth.setDate(currentMonth.getDate() - 7)), { weekStartsOn: 1 }));
        if (view === "day") setCurrentMonth(new Date(currentMonth.setDate(currentMonth.getDate() - 1)));
    };

    const jumpToToday = () => {
        const now = new Date();
        setCurrentMonth(now);
        setSelectedDate(now);
    };

    // Time slots for week/day view (8:00 to 20:00)
    const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8);

    const renderEventBlock = (event: CalendarEvent) => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        const startHour = start.getHours() + start.getMinutes() / 60;
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        // Calculate position relative to 8:00 start
        const top = (startHour - 8) * 60; // 60px per hour
        const height = durationHours * 60;

        const colorClass = event.type === "demo" ? "bg-blue-100 text-blue-700 border-blue-200" :
            event.type === "followup" ? "bg-purple-100 text-purple-700 border-purple-200" :
                event.type === "closing" ? "bg-green-100 text-green-700 border-green-200" :
                    event.type === "support" ? "bg-orange-100 text-orange-700 border-orange-200" :
                        "bg-gray-100 text-gray-700 border-gray-200";

        return (
            <div
                key={event.id}
                className={`absolute left-1 right-1 rounded px-2 py-1 text-xs border overflow-hidden cursor-pointer hover:brightness-95 transition-all z-10 ${colorClass}`}
                style={{ top: `${top}px`, height: `${height}px`, minHeight: "24px" }}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(new Date(event.startTime));
                    setSelectedEvent(event);
                }}
            >
                {event.meetingUrl && <Video className="absolute top-0.5 right-1 h-3 w-3 opacity-50" />}
                <div className="font-semibold truncate leading-none pr-3">{event.title}</div>
                <div className="text-[10px] opacity-80 truncate">{event.prospect.fullName}</div>
            </div>
        );
    };

    // Month view render helper for cell events
    const renderMonthCellEvent = (event: CalendarEvent) => {
        const colorClass = event.type === "demo" ? "bg-blue-100 text-blue-700 border-blue-200" :
            event.type === "followup" ? "bg-purple-100 text-purple-700 border-purple-200" :
                event.type === "closing" ? "bg-green-100 text-green-700 border-green-200" :
                    "bg-gray-100 text-gray-700 border-gray-200";

        return (
            <div
                key={event.id}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${colorClass} cursor-pointer hover:opacity-80 flex items-center gap-1`}
            >
                <span>{format(new Date(event.startTime), "HH:mm")}</span>
                <span className="truncate flex-1">{event.title}</span>
                {event.meetingUrl && <Video className="h-2.5 w-2.5 opacity-60 flex-shrink-0" />}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full gap-4 p-4 lg:p-6 bg-background">
            {/* Header / Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg">
                    <Button variant="outline" size="icon" onClick={prevPeriod}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="font-semibold w-40 text-center text-lg capitalize">
                        {view === "month" && format(currentMonth, "MMMM yyyy", { locale: fr })}
                        {view === "week" && `Semaine du ${format(startOfWeek(currentMonth, { weekStartsOn: 1 }), "d MMM", { locale: fr })}`}
                        {view === "day" && format(currentMonth, "d MMMM yyyy", { locale: fr })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={nextPeriod}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={jumpToToday} className="ml-2">
                        Aujourd'hui
                    </Button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                    <button
                        className={cn("px-3 py-1 text-sm rounded-md transition-all", view === "month" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setView("month")}
                    >
                        Mois
                    </button>
                    <button
                        className={cn("px-3 py-1 text-sm rounded-md transition-all", view === "week" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setView("week")}
                    >
                        Semaine
                    </button>
                    <button
                        className={cn("px-3 py-1 text-sm rounded-md transition-all", view === "day" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setView("day")}
                    >
                        Jour
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto gap-2"
                        onClick={() => signIn("google", { callbackUrl: "/dashboard/agenda" })}
                    >
                        <LinkIcon className="h-4 w-4" />
                        Sync Google
                    </Button>
                    <Button className="w-full sm:w-auto gap-2" onClick={() => setShowNewEventDialog(true)}>
                        <Plus className="h-4 w-4" />
                        Nouveau RDV
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
                {/* Main Calendar Grid */}
                <Card className="flex-1 flex flex-col shadow-sm overflow-hidden border-border/50">

                    {/* MONTH VIEW */}
                    {view === "month" && (
                        <>
                            <div className="grid grid-cols-7 border-b bg-muted/30">
                                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                                    <div key={d} className="py-3 text-center text-sm font-medium text-muted-foreground">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
                                {days.map((day, i) => {
                                    const dayEvents = getDayEvents(day);
                                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const isTodayDate = isToday(day);

                                    return (
                                        <div
                                            key={day.toString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={cn(
                                                "relative border-r border-b p-2 transition-colors cursor-pointer hover:bg-muted/30 flex flex-col gap-1 min-h-[80px]",
                                                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary",
                                                (i + 1) % 7 === 0 && "border-r-0"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span
                                                    className={cn(
                                                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                                        isTodayDate
                                                            ? "bg-primary text-primary-foreground"
                                                            : "text-foreground"
                                                    )}
                                                >
                                                    {format(day, "d")}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                                                {dayEvents.slice(0, 3).map((event) => renderMonthCellEvent(event))}
                                                {dayEvents.length > 3 && (
                                                    <span className="text-[10px] text-muted-foreground pl-1">
                                                        +{dayEvents.length - 3} autres
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* WEEK & DAY VIEW */}
                    {(view === "week" || view === "day") && (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Header Grid */}
                            <div className="flex border-b">
                                <div className="w-16 border-r bg-muted/30 shrink-0" /> {/* Time col placeholder */}
                                <div className={`grid flex-1 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                                    {days.map((day) => (
                                        <div key={day.toString()} className="text-center py-2 border-r last:border-r-0">
                                            <div className="text-xs text-muted-foreground">{format(day, "EEEE", { locale: fr })}</div>
                                            <div className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium mt-1", isToday(day) ? "bg-primary text-primary-foreground" : "")}>
                                                {format(day, "d")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Time Grid ScrollArea */}
                            <ScrollArea className="flex-1">
                                <div className="flex min-h-[600px] relative">
                                    {/* Time Axis */}
                                    <div className="w-16 border-r shrink-0 bg-muted/10">
                                        {timeSlots.map((hour) => (
                                            <div key={hour} className="h-[60px] border-b text-xs text-muted-foreground text-right pr-2 pt-1 relative">
                                                <span className="-top-2 relative">{hour}:00</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Columns */}
                                    <div className={`grid flex-1 relative ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                                        {days.map((day) => {
                                            const dayEvents = getDayEvents(day);
                                            return (
                                                <div key={day.toString()} className="border-r last:border-r-0 relative border-b h-[780px]">
                                                    {/* Grid lines matching time slots */}
                                                    {timeSlots.map((hour) => (
                                                        <div key={hour} className="h-[60px] border-b border-dashed border-border/40" />
                                                    ))}

                                                    {/* Events */}
                                                    {dayEvents.map(renderEventBlock)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                </Card>

                {/* Sidebar (Selected Day Agenda) */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <Card className="h-full border-border/50 shadow-sm flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-lg">
                                {selectedDate ? format(selectedDate, "EEEE d MMMM", { locale: fr }) : "Sélectionner une date"}
                            </h3>
                        </div>
                        <CardContent className="p-0 flex-1 min-h-0">
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-4">
                                    {!selectedDate || getDayEvents(selectedDate).length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8 text-sm">
                                            Aucun rendez-vous ce jour
                                        </div>
                                    ) : (
                                        <div className="relative mx-auto max-w-[90%] space-y-6">
                                            {getDayEvents(selectedDate).map((event) => (
                                                <div
                                                    key={event.id}
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0 cursor-pointer group hover:border-primary transition-colors"
                                                >
                                                    <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background group-hover:scale-110 transition-transform" />

                                                    <div className="mb-1 flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                                                        {format(new Date(event.startTime), "HH:mm")}
                                                        <span className="mx-1">•</span>
                                                        {Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000)} min
                                                    </div>

                                                    <div className="rounded-lg border bg-card p-3 shadow-sm group-hover:shadow-md transition-all">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${event.prospect.fullName}`} />
                                                                    <AvatarFallback>{event.prospect.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <h4 className="font-semibold text-sm leading-none">{event.title}</h4>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{event.prospect.fullName} • {event.prospect.company || ""}</p>
                                                                </div>
                                                            </div>
                                                            {/* Isolate Quick Actions from parent click */}
                                                            <div
                                                                onClick={(e) => e.stopPropagation()}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                            >
                                                                <EventQuickActions event={event} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <EventDialog
                open={showNewEventDialog}
                onOpenChange={setShowNewEventDialog}
                prospects={prospects}
                onSuccess={() => {
                    // refresh would happen via Server Actions revalidation usually
                }}
            />

            <EventDetailsDialog
                event={selectedEvent}
                open={!!selectedEvent}
                onOpenChange={(open) => !open && setSelectedEvent(null)}
            />
        </div>
    );
}
