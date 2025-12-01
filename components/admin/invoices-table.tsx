"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Invoice {
    id: string;
    number: number;
    amount: number;
    status: "paid" | "pending" | "void";
    type: "deposit" | "balance" | "standard";
    pdfUrl: string;
    createdAt: Date;
    project: { name: string };
    user: { fullName: string | null; email: string | null };
}

interface InvoicesTableProps {
    data: Invoice[];
}

export function InvoicesTable({ data }: InvoicesTableProps) {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Projet</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                Aucune facture trouvée.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">
                                    #{invoice.number}
                                </TableCell>
                                <TableCell>
                                    {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {invoice.user.fullName || "N/A"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {invoice.user.email}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>{invoice.project.name}</TableCell>
                                <TableCell>{(invoice.amount / 100).toFixed(2)} €</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {invoice.type === "deposit" ? "Acompte" : invoice.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={invoice.status === "paid" ? "default" : "secondary"}
                                        className={
                                            invoice.status === "paid"
                                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                : ""
                                        }
                                    >
                                        {invoice.status === "paid" ? "Payée" : "En attente"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(invoice.pdfUrl, "_blank")}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        PDF
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
