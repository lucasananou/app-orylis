"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketFileUploaderProps {
    projectId: string;
    onUploadComplete: (file: { name: string; url: string; type: string; size: number }) => void;
    disabled?: boolean;
}

export function TicketFileUploader({ projectId, onUploadComplete, disabled }: TicketFileUploaderProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Le fichier dépasse 10 Mo.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("projectId", projectId);
            formData.append("file", file, file.name);

            // Upload with skipDb=true so we can link it to the ticket later
            const response = await fetch("/api/files/signed-url?skipDb=true", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => ({}))) as { error?: string };
                throw new Error(payload.error ?? "Impossible d'uploader le fichier.");
            }

            const data = await response.json();

            onUploadComplete({
                name: file.name,
                url: data.uploadUrl,
                type: file.type,
                size: file.size
            });

            toast.success("Fichier attaché.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors de l'upload.";
            toast.error(message);
        } finally {
            setIsUploading(false);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || isUploading}
            >
                {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Paperclip className="mr-2 h-4 w-4" />
                )}
                Joindre un fichier
            </Button>
        </div>
    );
}
