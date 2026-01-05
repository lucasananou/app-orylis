import { auth } from "@/auth";
import { isStaff } from "@/lib/utils";
import { redirect } from "next/navigation";
import { NewQuotePageContent } from "@/components/admin/new-quote-page-content";

export const metadata = {
    title: "Nouveau Devis | Admin",
    description: "Création d'un devis personnalisé.",
};

export default async function NewQuotePage() {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <NewQuotePageContent />
        </div>
    );
}
