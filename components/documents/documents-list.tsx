"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Receipt } from "lucide-react";
import { formatDate } from "@/lib/utils"; // Make sure this util exists or use d-m-y
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Document {
    id: string;
    number?: number | null;
    projectName: string;
    status: string;
    pdfUrl: string;
    createdAt: string;
    amount?: number; // In cents
    type?: string;
}

interface DocumentsListProps {
    invoices: Document[];
    quotes: Document[];
}

export function DocumentsList({ invoices, quotes }: DocumentsListProps) {
    const formatPrice = (amount?: number) => {
        if (amount === undefined) return "-";
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR"
        }).format(amount / 100);
    };

    const StatusBadge = ({ status, type }: { status: string, type: 'invoice' | 'quote' }) => {
        const styles: Record<string, string> = {
            paid: "bg-green-100 text-green-700 hover:bg-green-100",
            pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
            void: "bg-slate-100 text-slate-700 hover:bg-slate-100",
            signed: "bg-green-100 text-green-700 hover:bg-green-100",
            cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
            draft: "bg-slate-100 text-slate-700 hover:bg-slate-100"
        };

        const label: Record<string, string> = {
            paid: "Payée",
            pending: "En attente",
            void: "Annulée",
            signed: "Signé",
            cancelled: "Annulé",
            draft: "Brouillon"
        };

        return (
            <Badge variant="secondary" className={styles[status] ?? "bg-slate-100"}>
                {label[status] ?? status}
            </Badge>
        );
    };

    const EmptyState = ({ label }: { label: string }) => (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-slate-200">
            <div className="p-3 bg-slate-50 rounded-full mb-4">
                <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Aucun document</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
                {label}
            </p>
        </div>
    );

    return (
        <Tabs defaultValue="invoices" className="space-y-6">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-full h-auto">
                <TabsTrigger value="invoices" className="rounded-full px-6 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                    Factures ({invoices.length})
                </TabsTrigger>
                <TabsTrigger value="quotes" className="rounded-full px-6 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                    Devis ({quotes.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="invoices">
                {invoices.length === 0 ? (
                    <EmptyState label="Vous n'avez aucune facture pour le moment." />
                ) : (
                    <div className="grid gap-4">
                        {invoices.map((invoice) => (
                            <Card key={invoice.id} className="overflow-hidden transition-all hover:shadow-md border-slate-200">
                                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-1 sm:mt-0">
                                            <Receipt className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-slate-900">Facture #{invoice.number}</h4>
                                                <StatusBadge status={invoice.status} type="invoice" />
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {formatDate(invoice.createdAt)} · {invoice.projectName}
                                            </div>
                                            <div className="font-semibold text-slate-900 sm:hidden">
                                                {formatPrice(invoice.amount)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                                        <div className="font-bold text-lg text-slate-900 hidden sm:block">
                                            {formatPrice(invoice.amount)}
                                        </div>
                                        <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto" asChild>
                                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                                PDF
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="quotes">
                {quotes.length === 0 ? (
                    <EmptyState label="Vous n'avez aucun devis pour le moment." />
                ) : (
                    <div className="grid gap-4">
                        {quotes.map((quote) => (
                            <Card key={quote.id} className="overflow-hidden transition-all hover:shadow-md border-slate-200">
                                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-1 sm:mt-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-slate-900">Devis #{quote.number || "N/A"}</h4>
                                                <StatusBadge status={quote.status} type="quote" />
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {formatDate(quote.createdAt)} · {quote.projectName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto" asChild>
                                            <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                                PDF
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
