import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, authUsers, projects, onboardingResponses, quotes } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { eq, asc, desc, or, sql, inArray, aliasedTable, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { type Client } from "@/components/admin/clients-list";

const referrers = aliasedTable(profiles, "referrers");

type LoadUsersOptions = {
    role?: "client" | "prospect";
    sortBy?: "name" | "createdAt";
};

export async function loadUsersData({ role, sortBy = "name" }: LoadUsersOptions = {}) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        redirect("/");
    }

    // Récupérer les utilisateurs filtrés
    const query = db
        .select({
            id: profiles.id,
            fullName: profiles.fullName,
            company: profiles.company,
            phone: profiles.phone,
            email: authUsers.email,
            role: profiles.role,
            createdAt: profiles.createdAt,
            referrerName: referrers.fullName,
            referrerCompany: referrers.company,
            prospectStatus: profiles.prospectStatus
        })
        .from(profiles)
        .innerJoin(authUsers, eq(profiles.id, authUsers.id))
        .leftJoin(referrers, eq(profiles.referrerId, referrers.id))
        .$dynamic();

    // Application des filtres
    const conditions = [];
    if (role) {
        conditions.push(eq(profiles.role, role));
    } else {
        conditions.push(or(eq(profiles.role, "prospect"), eq(profiles.role, "client")));
    }

    let queryWithWhere = query.where(and(...conditions));

    // Application du tri
    if (sortBy === "createdAt") {
        queryWithWhere = queryWithWhere.orderBy(desc(profiles.createdAt));
    } else {
        queryWithWhere = queryWithWhere.orderBy(asc(profiles.fullName));
    }

    const users = (await queryWithWhere) as unknown as {
        id: string;
        fullName: string | null;
        company: string | null;
        phone: string | null;
        email: string | null;
        role: "prospect" | "client" | "staff" | "sales";
        createdAt: Date | null;
        referrerName: string | null;
        referrerCompany: string | null;
        prospectStatus: string | null;
    }[];

    // --- Enrichissement des données (Téléphone, Projets, Devis) ---
    // (Copie de la logique existante)

    // 1. Phones from Onboarding
    const userIdsWithoutPhone = users.filter((c) => !c.phone).map((c) => c.id);
    let phoneFromOnboarding = new Map<string, string | null>();

    if (userIdsWithoutPhone.length > 0) {
        const onboardingData = await db
            .select({
                ownerId: projects.ownerId,
                payload: onboardingResponses.payload
            })
            .from(onboardingResponses)
            .innerJoin(projects, eq(onboardingResponses.projectId, projects.id))
            .where(inArray(projects.ownerId, userIdsWithoutPhone));

        onboardingData.forEach((row) => {
            if (!phoneFromOnboarding.has(row.ownerId) && row.payload && typeof row.payload === "object") {
                const payload = row.payload as Record<string, unknown>;
                const phone = (payload.phone as string | undefined) ?? null;
                if (phone) {
                    phoneFromOnboarding.set(row.ownerId, phone);
                }
            }
        });
    }

    const usersWithPhone = users.map((user) => ({
        ...user,
        phone: user.phone ?? phoneFromOnboarding.get(user.id) ?? null
    }));

    // 2. Projects & Counts
    const [allProjects, projectCounts] = await Promise.all([
        db
            .select({
                ownerId: projects.ownerId,
                id: projects.id,
                name: projects.name,
                demoUrl: projects.demoUrl,
                status: projects.status,
                createdAt: projects.createdAt
            })
            .from(projects)
            .orderBy(asc(projects.createdAt)),
        db
            .select({
                ownerId: projects.ownerId,
                count: sql<number>`COUNT(*)::int`.as("count")
            })
            .from(projects)
            .groupBy(projects.ownerId)
    ]);

    const projectsByOwner = new Map<string, typeof allProjects[0]>();
    const countsByOwner = new Map<string, number>();

    allProjects.forEach((project) => {
        if (!projectsByOwner.has(project.ownerId)) {
            projectsByOwner.set(project.ownerId, project);
        }
    });

    projectCounts.forEach((count) => {
        countsByOwner.set(count.ownerId, Number(count.count));
    });

    // 3. Quotes
    const projectIds = allProjects.map(p => p.id);
    let quotesByProject = new Map<string, { status: string, pdfUrl: string, signedPdfUrl: string | null }>();

    if (projectIds.length > 0) {
        const quotesData = await db.query.quotes.findMany({
            where: inArray(quotes.projectId, projectIds),
            columns: { projectId: true, status: true, pdfUrl: true, signedPdfUrl: true }
        });

        quotesData.forEach(q => {
            quotesByProject.set(q.projectId, q);
        });
    }

    // 4. Combine
    const finalUsers: Client[] = usersWithPhone
        .filter((user) => user.role !== "staff" && user.role !== "sales")
        .map((user) => {
            const firstProject = projectsByOwner.get(user.id);
            const projectCount = countsByOwner.get(user.id) ?? 0;

            let projectData = null;
            if (firstProject) {
                const quote = quotesByProject.get(firstProject.id);
                projectData = {
                    id: firstProject.id,
                    name: firstProject.name,
                    demoUrl: firstProject.demoUrl,
                    status: firstProject.status,
                    quoteStatus: quote?.status ?? null,
                    quotePdfUrl: quote?.signedPdfUrl ?? quote?.pdfUrl ?? null
                };
            }

            return {
                ...user,
                projectCount,
                firstProject: projectData,
                createdAt: user.createdAt?.toISOString() ?? null,
                role: user.role as "prospect" | "client",
                referrerName: user.referrerName,
                referrerCompany: user.referrerCompany,
                prospectStatus: user.prospectStatus ?? "new"
            };
        });

    return { clients: finalUsers };
}
