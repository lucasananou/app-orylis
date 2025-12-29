import { PageHeader } from "@/components/page-header";
import { ClientsList } from "@/components/admin/clients-list";
import { loadUsersData } from "@/actions/admin/data";

// Pas de cache pour l'admin : les actions doivent être immédiates
export const revalidate = 0;

export default async function AdminClientsPage() {
  const { clients } = await loadUsersData({ role: "client", sortBy: "name" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des clients"
        description="Liste des clients ayant signé un devis ou validé un projet."
      />

      <ClientsList clients={clients} />
    </div>
  );
}
