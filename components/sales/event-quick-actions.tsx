"use client";

import { useState, useTransition } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Edit, Trash2, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { cancelCalendarEvent, markEventCompleted } from "@/actions/calendar";
import { toast } from "sonner";
import { EventDialog } from "./event-dialog";

interface Event {
    id: string;
    title: string;
    description?: string | null;
    type: "demo" | "followup" | "closing" | "support" | "other";
    status: "scheduled" | "completed" | "cancelled" | "no_show";
    startTime: Date;
    endTime: Date;
    meetingUrl?: string | null;
    location?: string | null;
    notes?: string | null;
    prospect: {
        id: string;
        fullName: string | null;
    };
}

interface EventQuickActionsProps {
    event: Event;
    onUpdate?: () => void;
}

export function EventQuickActions({ event, onUpdate }: EventQuickActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const handleCopyMeetingUrl = () => {
        if (event.meetingUrl) {
            navigator.clipboard.writeText(event.meetingUrl);
            toast.success("Lien copié dans le presse-papier");
        } else {
            toast.error("Aucun lien de réunion");
        }
    };

    const handleOpenMeetingUrl = () => {
        if (event.meetingUrl) {
            window.open(event.meetingUrl, "_blank", "noopener,noreferrer");
        }
    };

    const handleCancel = () => {
        startTransition(async () => {
            try {
                await cancelCalendarEvent(event.id);
                toast.success("Rendez-vous annulé");
                setShowCancelDialog(false);
                onUpdate?.();
            } catch (error) {
                toast.error("Erreur lors de l'annulation");
                console.error(error);
            }
        });
    };

    const handleMarkCompleted = () => {
        startTransition(async () => {
            try {
                await markEventCompleted(event.id);
                toast.success("Rendez-vous marqué comme terminé");
                onUpdate?.();
            } catch (error) {
                toast.error("Erreur");
                console.error(error);
            }
        });
    };

    const isUpcoming = event.status === "scheduled" && new Date(event.startTime) > new Date();
    const isPast = event.status === "scheduled" && new Date(event.startTime) <= new Date();
    const isCompleted = event.status === "completed";
    const isCancelled = event.status === "cancelled";

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {isUpcoming && (
                        <>
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setShowEditDialog(true);
                            }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {event.meetingUrl && (
                        <>
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMeetingUrl();
                            }}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ouvrir le lien
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleCopyMeetingUrl();
                            }}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copier le lien
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {isPast && !isCompleted && !isCancelled && (
                        <>
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleMarkCompleted();
                            }}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marquer terminé
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {isUpcoming && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCancelDialog(true);
                            }}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Annuler le RDV
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler le rendez-vous ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action marquera le rendez-vous comme annulé. Le prospect sera informé par email.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Retour</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Annulation..." : "Annuler le RDV"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EventDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                prospectId={event.prospect.id}
                prospectName={event.prospect.fullName || undefined}
                event={{
                    id: event.id,
                    title: event.title,
                    description: event.description || undefined,
                    type: event.type,
                    startTime: new Date(event.startTime),
                    endTime: new Date(event.endTime),
                    meetingUrl: event.meetingUrl || undefined,
                    location: event.location || undefined,
                    notes: event.notes || undefined,
                }}
                onSuccess={onUpdate}
            />
        </>
    );
}
