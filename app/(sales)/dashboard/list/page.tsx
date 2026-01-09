import { getSalesData } from "@/actions/data-fetching";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }> = {
    "new": { label: "Nouveau", variant: "default" },
    "contacted": { label: "Contacté", variant: "secondary" },
    "meeting": { label: "RDV", variant: "outline" }, // Using outline or a specific color if available
    "proposal": { label: "Proposition", variant: "secondary" },
    "won": { label: "Gagné", variant: "success" }, // Assuming success variant exists or falling back
    "lost": { label: "Perdu", variant: "destructive" },
    // Fallback/Legacy
    "demo_sent": { label: "Démo envoyée", variant: "secondary" },
    "offer_sent": { label: "Offre envoyée", variant: "secondary" },
    "negotiation": { label: "Négociation", variant: "secondary" },
};

export default async function ListPage() {
    const { prospects } = await getSalesData();

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Tous les prospects</h1>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des prospects ({prospects.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Société</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>RDV</TableHead>
                                    <TableHead>Inscrit le</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {prospects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            Aucun prospect
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    prospects.map((prospect) => {
                                        const status = statusMap[prospect.prospectStatus] || { label: prospect.prospectStatus, variant: "outline" };
                                        return (
                                            <TableRow key={prospect.id}>
                                                <TableCell className="font-medium">
                                                    {prospect.fullName || "Sans nom"}
                                                </TableCell>
                                                <TableCell>{prospect.company || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant as any} className="whitespace-nowrap">
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {prospect.meetingBookedAt ? (
                                                        <Badge variant="outline" className="font-normal">
                                                            {formatDate(prospect.meetingBookedAt)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(prospect.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/prospects/${prospect.id}`}>
                                                            Voir
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
