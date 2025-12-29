import { redirect } from "next/navigation";
import { eq, desc, inArray, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { invoices, projects, quotes, profiles } from "@/lib/schema";
import { isStaff, isProspect } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { DocumentsList } from "@/components/documents/documents-list";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const revalidate = 0; // Force dynamic to get latest docs

async function loadDocumentsData() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = session.user!;

    // If staff, we might want to redirect or show everything? 
    // Usually staff uses Admin panel. Let's redirect staff to Admin Invoices.
    if (isStaff(user.role)) {
        redirect("/admin/invoices");
    }

    // 1. Get User's Projects
    // We look for projects where ownerId is the user's profile ID.
    const userProjects = await db.query.projects.findMany({
        where: eq(projects.ownerId, user.id),
        columns: { id: true }
    });

    const projectIds = userProjects.map(p => p.id);

    // 2. Fetch Invoices
    // Invoices are linked to userId OR projectId.
    // Ideally we fetch where userId = user.id.
    const userInvoices = await db.query.invoices.findMany({
        where: (invoice, { eq, or, inArray }) => or(
            eq(invoice.userId, user.id),
            // Also include invoices from user's projects if userId is missing or different (though it should match)
            projectIds.length > 0 ? inArray(invoice.projectId, projectIds) : undefined
        ),
        orderBy: [desc(invoices.createdAt)],
        with: {
            project: {
                columns: { name: true }
            }
        }
    });

    // 3. Fetch Quotes
    // Quotes are linked to projectId.
    let userQuotes: any[] = [];
    if (projectIds.length > 0) {
        userQuotes = await db.query.quotes.findMany({
            where: inArray(quotes.projectId, projectIds),
            orderBy: [desc(quotes.createdAt)],
            with: {
                project: {
                    columns: { name: true }
                }
            }
        });
    }

    return {
        role: user.role,
        invoices: userInvoices.map(inv => ({
            id: inv.id,
            number: inv.number,
            projectName: inv.project.name,
            status: inv.status,
            pdfUrl: inv.pdfUrl,
            amount: inv.amount,
            type: inv.type,
            createdAt: inv.createdAt.toISOString()
        })),
        quotes: userQuotes.map(qt => ({
            id: qt.id,
            number: qt.number,
            projectName: qt.project.name,
            status: qt.status,
            pdfUrl: qt.signedPdfUrl || qt.pdfUrl, // Prefer signed if available
            createdAt: qt.createdAt.toISOString()
        }))
    };
}

export default async function DocumentsPage() {
    const { role, invoices, quotes } = await loadDocumentsData();
    const isProspectUser = isProspect(role);

    // Optional: Restricted view for prospects if needed, but usually prospects HAVE quotes so they should see them.
    // They might not have invoices yet.

    return (
        <div className="space-y-6">
            <PageHeader
                title="Mes Documents"
                description="Retrouvez ici tous vos devis signés et vos factures."
            />

            <DocumentsList
                invoices={invoices}
                quotes={quotes}
            />
        </div>
    );
}
