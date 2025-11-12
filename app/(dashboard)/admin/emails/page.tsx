import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaff } from "@/lib/utils";
import { EmailTemplatesEditor } from "@/components/admin/email-templates-editor";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Gestion des emails</h1>
        <p className="text-muted-foreground mt-2">
          Modifiez les templates d'emails envoyés aux clients et à l'équipe.
        </p>
      </div>

      <EmailTemplatesEditor />
    </div>
  );
}

