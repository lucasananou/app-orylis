import { PageHeader } from "@/components/page-header";
import { ProspectsTable } from "@/components/admin/prospects-table";
import { loadUsersData } from "@/actions/admin/data";

// Pas de cache pour l'admin : les actions doivent être immédiates
export const revalidate = 0;

export default async function AdminProspectsPage() {
    const { clients } = await loadUsersData({ role: "prospect", sortBy: "createdAt" });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion des prospects"
                description="Suivez l'avancement de vos prospects dans le pipeline de vente."
            />

            <ProspectsTable data={clients} />
        </div>
    );
}
