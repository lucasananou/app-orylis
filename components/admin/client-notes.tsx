"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateClientNotes } from "@/actions/admin/clients";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ClientNotesProps {
    clientId: string;
    initialNotes: string | null;
}

export function ClientNotes({ clientId, initialNotes }: ClientNotesProps) {
    const [notes, setNotes] = useState(initialNotes || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateClientNotes(clientId, notes);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Notes sauvegardées.");
            }
        } catch {
            toast.error("Erreur de connexion.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex justify-between items-center">
                    Notes Internes (Privé)
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8 w-8 p-0"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[150px]">
                <Textarea
                    placeholder="Notez ici les informations importantes sur le client..."
                    className="h-full min-h-[150px] resize-none border-0 focus-visible:ring-0 p-0 shadow-none text-sm placeholder:text-muted-foreground/50"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSave} // Autosave on blur
                />
            </CardContent>
        </Card>
    );
}
