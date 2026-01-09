"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { deleteProspect, updateProspect } from "@/actions/sales";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProspectMenuProps {
    id: string;
    initialData: {
        fullName: string | null;
        company: string | null;
        phone: string | null;
    };
}

export function ProspectMenu({ id, initialData }: ProspectMenuProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editOpen, setEditOpen] = useState(false);
    const [formData, setFormData] = useState(initialData);

    const handleDelete = () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce prospect ?")) return;

        startTransition(async () => {
            try {
                await deleteProspect(id);
                toast.success("Prospect supprimé");
                router.push("/dashboard/list" as any);
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                // Remove nulls to satisfy optional type
                const cleanData = {
                    fullName: formData.fullName || undefined,
                    company: formData.company || undefined,
                    phone: formData.phone || undefined,
                };
                await updateProspect(id, cleanData);
                toast.success("Prospect modifié");
                setEditOpen(false);
            } catch (error) {
                toast.error("Erreur lors de la modification");
            }
        });
    };

    return (
        <>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le prospect</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations principales du prospect ici.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                                id="name"
                                value={formData.fullName || ""}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Société</Label>
                            <Input
                                id="company"
                                value={formData.company || ""}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ""}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
