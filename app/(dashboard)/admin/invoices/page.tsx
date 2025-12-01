import { db } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { InvoicesTable } from "@/components/admin/invoices-table";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
    const allInvoices = await db.query.invoices.findMany({
        orderBy: [desc(invoices.number)],
        with: {
            project: {
                columns: { name: true }
            },
            user: {
                columns: { fullName: true },
                with: {
                    authUser: {
                        columns: { email: true }
                    }
                }
            }
        }
    });

    const formattedInvoices = allInvoices.map(inv => ({
        ...inv,
        user: {
            fullName: inv.user.fullName,
            email: inv.user.authUser?.email ?? null
        }
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
                <p className="text-muted-foreground">
                    Gérez les factures et les paiements.
                </p>
            </div>

            <InvoicesTable data={formattedInvoices} />
        </div>
    );
}
