import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotes, projects, profiles, authUsers } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { QuotesList } from "@/components/admin/quotes-list";

export const dynamic = "force-dynamic";

async function loadQuotesData() {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/");
  }

  // Récupérer tous les devis avec les informations du projet et du prospect
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
      ownerId: projects.ownerId
    })
    .from(quotes)
    .innerJoin(projects, eq(quotes.projectId, projects.id))
    .orderBy(desc(quotes.createdAt));

  // Récupérer les informations des prospects pour chaque devis
  const quotesWithProspectInfo = await Promise.all(
    quotesData.map(async (quote) => {
      const [profile, authUser] = await Promise.all([
        db.query.profiles.findFirst({
          where: eq(profiles.id, quote.ownerId),
          columns: {
            fullName: true,
            company: true
          }
        }),
        db.query.authUsers.findFirst({
          where: eq(authUsers.id, quote.ownerId),
          columns: {
            email: true,
            name: true
          }
        })
      ]);

      return {
        ...quote,
        prospectName: profile?.fullName ?? authUser?.name ?? "—",
        prospectEmail: authUser?.email ?? "—",
        company: profile?.company ?? null,
        createdAt: quote.createdAt?.toISOString() ?? null,
        signedAt: quote.signedAt?.toISOString() ?? null
      };
    })
  );

  return { quotes: quotesWithProspectInfo };
}

export default async function AdminQuotesPage() {
  const { quotes } = await loadQuotesData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des devis"
        description="Consultez tous les devis générés et signés par les prospects."
      />

      <QuotesList quotes={quotes} />
    </div>
  );
}

