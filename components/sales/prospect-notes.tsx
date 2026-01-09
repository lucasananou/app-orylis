"use client";

import { useTransition, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addProspectNote } from "@/actions/sales";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Mail, FileText, Users } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const typeIcons = {
    note: <FileText className="h-4 w-4" />,
    call: <Phone className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    meeting: <Users className="h-4 w-4" />,
    // System events
    system_create: <Users className="h-4 w-4" />,
    system_status: <FileText className="h-4 w-4" />,
    system_meeting: <Users className="h-4 w-4" />,
};

const typeLabels = {
    note: "Note",
    call: "Appel",
    email: "Email",
    meeting: "RDV",
    system_create: "Création",
    system_status: "Statut",
    system_meeting: "RDV",
};

interface Activity {
    id: string;
    type: "note" | "call" | "email" | "meeting" | "system_create" | "system_status" | "system_meeting";
    content: string;
    createdAt: Date;
    author: {
        name: string | null;
        image: string | null;
    } | null;
    isSystem?: boolean;
}

interface ProspectNotesProps {
    id: string;
    notes: Activity[];
}

export function ProspectNotes({ id, notes }: ProspectNotesProps) {
    const [newNote, setNewNote] = useState("");
    const [noteType, setNoteType] = useState<"note" | "call" | "email" | "meeting">("note");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        startTransition(async () => {
            try {
                await addProspectNote(id, newNote, noteType);
                toast.success("Action enregistrée");
                setNewNote("");
                setNoteType("note"); // Reset to default
            } catch (error) {
                toast.error("Erreur lors de l'ajout");
            }
        });
    };

    return (
        <div className="flex flex-col h-[450px]">
            <div className="flex-1 min-h-0 mb-4">
                <ScrollArea className="h-full pr-4">
                    {notes.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            Aucune activité pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {notes.map((activity) => (
                                <div key={activity.id} className="flex gap-3 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-background z-10 shrink-0 ${activity.isSystem
                                            ? "bg-gray-100 text-gray-600"
                                            : "bg-blue-100 text-blue-600"
                                            }`}>
                                            {typeIcons[activity.type] || <FileText className="h-4 w-4" />}
                                        </div>
                                        <div className="w-px h-full bg-border -mb-6 group-last:hidden" />
                                    </div>

                                    <div className="flex-1 space-y-1 pb-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium leading-none">
                                                {activity.isSystem ? "Système" : (activity.author?.name || "Utilisateur inconnu")}
                                            </p>
                                            <span className="text-xs text-muted-foreground">• {formatDate(activity.createdAt)}</span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${activity.type === 'call' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                activity.type === 'email' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    activity.type === 'meeting' || activity.type === 'system_meeting' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        activity.isSystem ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                            'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                {typeLabels[activity.type] || activity.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 bg-gray-50/50 p-3 rounded-md whitespace-pre-wrap">
                                            {activity.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 space-y-4 pt-4 border-t bg-background z-20">
                <div className="flex gap-2">
                    <Select value={noteType} onValueChange={(v: any) => setNoteType(v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="note"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Note</div></SelectItem>
                            <SelectItem value="call"><div className="flex items-center gap-2"><Phone className="h-4 w-4" /> Appel</div></SelectItem>
                            <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</div></SelectItem>
                            <SelectItem value="meeting"><div className="flex items-center gap-2"><Users className="h-4 w-4" /> RDV</div></SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex-1">
                        <Textarea
                            placeholder={`Détails de l'action (${typeLabels[noteType]})...`}
                            className="min-h-[80px]"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={!newNote.trim() || isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isPending ? "Ajout..." : "Enregistrer l'action"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
