"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileText, Download, CheckCircle, Clock, XCircle, Send, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { relaunchQuote, deleteQuote } from "@/actions/admin/quotes";
import { toast } from "sonner";

export interface Quote {
    id: string;
    projectId: string;
    projectName: string;
    pdfUrl: string;
    signedPdfUrl: string | null;
    status: "pending" | "signed" | "cancelled" | string;
    signedAt: string | null;
    createdAt: string | null;
    prospectName: string;
    prospectEmail: string;
    company: string | null;
}

interface QuotesTableProps {
    quotes: Quote[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
    pending: { label: "En attente", className: "bg-orange-100 text-orange-800 border-orange-200", icon: Clock },
    signed: { label: "Signé", className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
    cancelled: { label: "Annulé", className: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export function QuotesTable({ quotes }: QuotesTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    const handleRelaunch = async (quoteId: string) => {
        setLoadingMap(prev => ({ ...prev, [quoteId + "-relaunch"]: true }));
        try {
            const res = await relaunchQuote(quoteId);
            if (res.error) toast.error(res.error);
            else toast.success(res.message);
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setLoadingMap(prev => ({ ...prev, [quoteId + "-relaunch"]: false }));
        }
    };

    const handleDelete = async (quoteId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce devis ?")) return;

        setLoadingMap(prev => ({ ...prev, [quoteId + "-delete"]: true }));
        try {
            const res = await deleteQuote(quoteId);
            if (res.error) toast.error(res.error);
            else toast.success(res.message);
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setLoadingMap(prev => ({ ...prev, [quoteId + "-delete"]: false }));
        }
    };

    const filteredQuotes = quotes.filter((quote) => {
        const query = searchQuery.toLowerCase();
        return (
            quote.prospectName.toLowerCase().includes(query) ||
            quote.projectName.toLowerCase().includes(query) ||
            quote.prospectEmail.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative max-w-sm w-full">
                    <Input
                        placeholder="Rechercher un devis (client, projet)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-3"
                    />
                </div>
                <Badge variant="outline" className="ml-auto">
                    {filteredQuotes.length} Devis
                </Badge>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead>Client / Prospect</TableHead>
                            <TableHead>Projet</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredQuotes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Aucun devis trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredQuotes.map((quote) => {
                                const statusConfig = STATUS_CONFIG[quote.status] || {
                                    label: quote.status,
                                    className: "bg-gray-100 text-gray-800 border-gray-200",
                                    icon: Clock
                                };
                                const StatusIcon = statusConfig.icon;
                                const isRelaunching = loadingMap[quote.id + "-relaunch"];
                                const isDeleting = loadingMap[quote.id + "-delete"];

                                return (
                                    <TableRow key={quote.id}>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {quote.createdAt ? formatDate(quote.createdAt) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{quote.prospectName}</span>
                                                <span className="text-xs text-muted-foreground">{quote.company || quote.prospectEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{quote.projectName}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`gap-1 pr-2.5 ${statusConfig.className}`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {statusConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild title="Voir PDF Original">
                                                    <Link href={quote.pdfUrl as any} target="_blank">
                                                        <FileText className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                {quote.signedPdfUrl && (
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-green-200 bg-green-50 text-green-700 hover:bg-green-100" asChild title="Voir PDF Signé">
                                                        <Link href={quote.signedPdfUrl as any} target="_blank">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}

                                                {quote.status === "pending" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => handleRelaunch(quote.id)}
                                                        disabled={isRelaunching}
                                                        title="Relancer le devis (Email)"
                                                    >
                                                        {isRelaunching ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Send className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(quote.id)}
                                                    disabled={isDeleting}
                                                    title="Supprimer le devis"
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
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
