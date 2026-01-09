"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, User, Video, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CalendarEvent } from "./meetings-calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EventDetailsDialogProps {
    event: CalendarEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${event.type === "demo" ? "bg-blue-500" :
                            event.type === "followup" ? "bg-purple-500" :
                                event.type === "closing" ? "bg-green-500" :
                                    "bg-gray-500"
                            }`} />
                        {event.title}
                    </DialogTitle>
                    <DialogDescription>
                        Détails du rendez-vous
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                        <div className="bg-muted p-2 rounded-md">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">
                                {format(new Date(event.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                            </div>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${event.prospect.fullName}`} />
                            <AvatarFallback>{event.prospect.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium text-sm">{event.prospect.fullName}</p>
                            {event.prospect.company && (
                                <p className="text-sm text-muted-foreground">{event.prospect.company}</p>
                            )}
                            <Link
                                href={`/prospects/${event.prospect.id}`}
                                className="text-xs text-primary hover:underline inline-flex items-center mt-1"
                            >
                                Voir la fiche client <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Meeting Link */}
                    {event.meetingUrl ? (
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-50 p-2 rounded-md">
                                <Video className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm text-blue-900">Google Meet</p>
                                <a
                                    href={event.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline break-all"
                                >
                                    Rejoindre la réunion
                                </a>
                            </div>
                        </div>
                    ) : (["demo", "followup", "closing"].includes(event.type)) && (
                        <div className="flex items-start gap-3">
                            <div className="bg-gray-100 p-2 rounded-md">
                                <Video className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm text-gray-700">Google Meet</p>
                                <p className="text-sm text-gray-500 italic">
                                    Lien non généré. Vérifiez la connexion Google.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="flex items-start gap-3">
                            <div className="bg-muted p-2 rounded-md">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md flex-1 text-sm text-muted-foreground whitespace-pre-wrap">
                                {event.description}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-4 sm:gap-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                    <Button asChild className="gap-2">
                        <Link href={`/prospects/${event.prospect.id}`}>
                            Prendre des notes
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
