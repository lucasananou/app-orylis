import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, projects, profiles, authUsers } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { QuotesTable } from "@/components/admin/quotes-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

// Cache 60 secondes : les devis ne changent pas très souvent
export const revalidate = 60;

async function loadQuotesData() {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/");
  }

  // Récupérer tous les devis avec les informations du projet et du prospect en une seule requête
  const quotesData = await db
    .select({
      id: quotes.id,
      projectId: quotes.projectId,
      projectName: projects.name,
      pdfUrl: quotes.pdfUrl,
      signedPdfUrl: quotes.signedPdfUrl,
      status: quotes.status,
      signedAt: quotes.signedAt,
      createdAt: quotes.createdAt,
      ownerId: projects.ownerId,
      prospectFullName: profiles.fullName,
      prospectCompany: profiles.company,
      prospectEmail: authUsers.email,
      prospectName: authUsers.name
    })
    .from(quotes)
    .innerJoin(projects, eq(quotes.projectId, projects.id))
    .leftJoin(profiles, eq(projects.ownerId, profiles.id))
    .leftJoin(authUsers, eq(projects.ownerId, authUsers.id))
    .orderBy(desc(quotes.createdAt));

  const quotesWithProspectInfo = quotesData.map((quote) => ({
    id: quote.id,
    projectId: quote.projectId,
    projectName: quote.projectName,
    pdfUrl: quote.pdfUrl,
    signedPdfUrl: quote.signedPdfUrl,
    status: quote.status,
    signedAt: quote.signedAt?.toISOString() ?? null,
    createdAt: quote.createdAt?.toISOString() ?? null,
    prospectName: quote.prospectFullName ?? quote.prospectName ?? "—",
    prospectEmail: quote.prospectEmail ?? "—",
    company: quote.prospectCompany ?? null
  }));

  return { quotes: quotesWithProspectInfo };
}

export default async function AdminQuotesPage() {
  const { quotes } = await loadQuotesData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des devis"
        description="Consultez tous les devis générés et signés par les prospects."
        actions={
          <Button asChild>
            <Link href={"/admin/quotes/new" as any}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau devis
            </Link>
          </Button>
        }
      />

      <QuotesTable quotes={quotes} />
    </div>
  );
}

