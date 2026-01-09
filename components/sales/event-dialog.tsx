"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCalendarEvent, updateCalendarEvent } from "@/actions/calendar";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prospectId?: string;
    prospectName?: string;
    prospects?: {
        id: string;
        fullName: string | null;
        company: string | null;
    }[];
    event?: {
        id: string;
        title: string;
        description?: string;
        type: "demo" | "followup" | "closing" | "support" | "other";
        startTime: Date;
        endTime: Date;
        meetingUrl?: string;
        location?: string;
        notes?: string;
    };
    onSuccess?: () => void;
}

export function EventDialog({ open, onOpenChange, prospectId, prospectName, prospects = [], event, onSuccess }: EventDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedProspectId, setSelectedProspectId] = useState(prospectId || "");
    const [title, setTitle] = useState(event?.title || "");
    const [description, setDescription] = useState(event?.description || "");
    const [type, setType] = useState<"demo" | "followup" | "closing" | "support" | "other">(event?.type || "demo");
    const [startDate, setStartDate] = useState<Date>(event?.startTime || new Date());
    const [startTime, setStartTime] = useState(event?.startTime ? format(event.startTime, "HH:mm") : "14:00");
    const [duration, setDuration] = useState("60"); // minutes
    const [meetingUrl, setMeetingUrl] = useState(event?.meetingUrl || "");

    const { data: session } = useSession();

    const isEditing = !!event;

    // Warning if Google not connected
    const showGoogleWarning = session?.user && !session.user.isGoogleConnected;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // If editing, prospect is already linked. If creating, need a prospect.
        if (!isEditing && !selectedProspectId) {
            toast.error("Aucun prospect sélectionné");
            return;
        }

        if (!title.trim()) {
            toast.error("Le titre est requis");
            return;
        }

        // Combine date and time
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDateTime = new Date(startDate);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));

        startTransition(async () => {
            try {
                if (isEditing && event) {
                    await updateCalendarEvent(event.id, {
                        title,
                        description,
                        type,
                        startTime: startDateTime.toISOString(),
                        endTime: endDateTime.toISOString(),
                        meetingUrl,
                    });
                    toast.success("Rendez-vous modifié");
                } else {
                    const result = await createCalendarEvent({
                        prospectId: selectedProspectId!,
                        title,
                        description,
                        type,
                        startTime: startDateTime.toISOString(),
                        endTime: endDateTime.toISOString(),
                        meetingUrl,
                    });

                    if (result && 'warning' in result && result.warning) {
                        toast.warning(result.warning);
                    } else {
                        toast.success("Rendez-vous créé");
                    }
                }

                onSuccess?.();
                onOpenChange(false);

                // Reset form
                if (!isEditing) {
                    setTitle("");
                    setDescription("");
                    setType("demo");
                    setStartDate(new Date());
                    setStartTime("14:00");
                    setDuration("60");
                    setMeetingUrl("");
                }
            } catch (error) {
                toast.error("Erreur lors de l'enregistrement");
                console.error(error);
            }
        });
    };

    const typeLabels = {
        demo: "Démo",
        followup: "Suivi",
        closing: "Closing",
        support: "Support",
        other: "Autre"
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle>
                    <DialogDescription>
                        {prospectName && `Avec ${prospectName}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4">
                    {showGoogleWarning && (
                        <div className="bg-amber-50 text-amber-900 px-4 py-3 rounded-md text-sm border border-amber-200 flex items-start gap-3">
                            <div className="font-semibold text-amber-600">⚠️</div>
                            <div>
                                <p className="font-semibold">Compte Google non connecté</p>
                                <p className="mt-1 opacity-90">Pour générer un lien Google Meet automatiquement, vous devez connecter votre compte Google.</p>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto font-semibold text-amber-800 underline mt-2"
                                    onClick={() => window.location.href = "/api/auth/signin?callbackUrl=/dashboard/agenda"}
                                >
                                    Se connecter avec Google
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Prospect Selection - Only show if not pre-selected */}
                    {!prospectId && !isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="prospect">Prospect *</Label>
                            <Select value={selectedProspectId} onValueChange={setSelectedProspectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un prospect" />
                                </SelectTrigger>
                                <SelectContent>
                                    {prospects.map((prospect) => (
                                        <SelectItem key={prospect.id} value={prospect.id}>
                                            {prospect.fullName || "Sans nom"} {prospect.company ? `(${prospect.company})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ex: Démo du produit"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type de rendez-vous *</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(typeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => date && setStartDate(date)}
                                        initialFocus
                                        locale={fr}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startTime">Heure *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Durée</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15 min</SelectItem>
                                <SelectItem value="30">30 min</SelectItem>
                                <SelectItem value="45">45 min</SelectItem>
                                <SelectItem value="60">1 heure</SelectItem>
                                <SelectItem value="90">1h30</SelectItem>
                                <SelectItem value="120">2 heures</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Notes internes sur ce rendez-vous..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
