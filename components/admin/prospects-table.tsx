"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Using sonner as seen in imports
import { updateProspectStatus, deleteProspect, setDemoUrl } from "@/actions/admin/prospects";
import { Client } from "./clients-list"; // Reuse type
import { formatDate } from "@/lib/utils";
import { Phone, Mail, MoreHorizontal, ExternalLink, FileText, ArrowRight, Loader2, PhoneCall, Calendar, Trash2 } from "lucide-react";
import { sendMeetingRequest } from "@/actions/admin/users";
import Link from "next/link";
import { ImpersonateButton } from "./impersonate-button";
import { SalesCallDialog } from "./sales/sales-call-dialog";

interface ProspectsTableProps {
    data: Client[];
}

const STATUS_LABELS: Record<string, string> = {
    new: "Nouveau",
    contacted: "Contacté",
    offer_sent: "Offre envoyée",
    negotiation: "En négo",
    lost: "Perdu"
};

const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
    offer_sent: "bg-purple-100 text-purple-800 border-purple-200",
    negotiation: "bg-orange-100 text-orange-800 border-orange-200",
    lost: "bg-gray-100 text-gray-800 border-gray-200"
};

export function ProspectsTable({ data }: ProspectsTableProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const filteredData = data.filter(client => {
        const query = searchQuery.toLowerCase();
        return (
            client.fullName?.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.company?.toLowerCase().includes(query)
        );
    });

    const handleStatusChange = async (clientId: string, newStatus: string) => {
        setUpdatingId(clientId);
        try {
            const res = await updateProspectStatus(clientId, newStatus);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Statut mis à jour");
                router.refresh();
            }
        } catch (e) {
            toast.error("Erreur...");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
                <Badge variant="outline" className="ml-auto">
                    {filteredData.length} Prospect{filteredData.length > 1 ? "s" : ""}
                </Badge>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prospect</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Projet</TableHead>
                            <TableHead>Statut CRM</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Aucun prospect trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((client) => {
                                const status = client.prospectStatus || "new";
                                const isBusy = updatingId === client.id;

                                return (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Link href={`/admin/clients/${client.id}`} className="font-medium hover:underline">
                                                    {client.fullName || "Sans nom"}
                                                </Link>
                                                <span className="text-xs text-muted-foreground">{client.company}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                {client.email && (
                                                    <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-primary">
                                                        <Mail className="h-3 w-3" /> {client.email}
                                                    </a>
                                                )}
                                                {client.phone && (
                                                    <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-primary">
                                                        <Phone className="h-3 w-3" /> {client.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {client.firstProject ? (
                                                <div className="text-sm">
                                                    <div>{client.firstProject.name}</div>
                                                    {client.firstProject.quoteStatus === 'pending' && (
                                                        <Badge variant="outline" className="text-[10px] mt-1 border-orange-200 text-orange-700 bg-orange-50">
                                                            Devis en attente
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs text-center">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={`h-7 text-xs border ${STATUS_COLORS[status] || "bg-gray-100"}`}
                                                        disabled={isBusy}
                                                    >
                                                        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : STATUS_LABELS[status] || status}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                                        <DropdownMenuItem
                                                            key={key}
                                                            onClick={() => handleStatusChange(client.id, key)}
                                                            className={key === status ? "bg-accent" : ""}
                                                        >
                                                            {label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                            {client.createdAt ? formatDate(client.createdAt) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <Link href={`/admin/clients/${client.id}`}>
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <FileText className="mr-2 h-4 w-4" /> Détails
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            toast.promise(sendMeetingRequest(client.id), {
                                                                loading: 'Envoi en cours...',
                                                                success: 'Email envoyé ! 📅',
                                                                error: 'Erreur lors de l\'envoi'
                                                            });
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Calendar className="mr-2 h-4 w-4" /> Proposer un RDV
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            const url = window.prompt("Entrez l'URL de la démo :");
                                                            if (url) {
                                                                toast.promise(setDemoUrl(client.id, url), {
                                                                    loading: 'Ajout du lien...',
                                                                    success: 'Lien démo ajouté ! 🔗',
                                                                    error: 'Erreur lors de l\'ajout'
                                                                });
                                                            }
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <ExternalLink className="mr-2 h-4 w-4" /> Ajouter lien démo
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            if (window.confirm("Êtes-vous sûr de vouloir supprimer ce prospect ? Cette action est irréversible.")) {
                                                                toast.promise(deleteProspect(client.id), {
                                                                    loading: 'Suppression...',
                                                                    success: 'Prospect supprimé 🗑️',
                                                                    error: 'Erreur lors de la suppression'
                                                                });
                                                            }
                                                        }}
                                                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
