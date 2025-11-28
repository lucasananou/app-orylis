import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaff } from "@/lib/utils";
import { EmailPreviewGallery } from "@/components/admin/email-preview-gallery";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const session = await auth();

  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Aperçu des emails</h1>
        <p className="text-muted-foreground mt-2">
          Visualisez les emails envoyés automatiquement par l'application.
          <br />
          <span className="text-sm italic">Note : Les contenus sont gérés directement dans le code pour garantir la cohérence.</span>
        </p>
      </div>

      <EmailPreviewGallery />
    </div>
  );
}

