import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { NavbarWrapper } from "@/components/navbar-wrapper";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function SalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;

    if (!user || user.role !== "sales") {
        redirect("/");
    }

    // Fetch counts for sidebar
    const [clientsCount, prospectsCount] = await Promise.all([
        db.select().from(profiles).where(eq(profiles.role, "client")),
        db.select().from(profiles).where(eq(profiles.role, "prospect"))
    ]);

    const counts = {
        clients: clientsCount.length,
        prospects: prospectsCount.length
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar role="sales" counts={counts} />
            <div className="flex flex-1 flex-col">
                <NavbarWrapper
                    role="sales"
                    userEmail={user.email ?? "—"}
                    userName={user.name}
                    projects={[]}
                />
                <main className="flex-1 bg-gradient-to-b from-[#F7F9FB] via-white to-white py-4 sm:py-5 md:py-6">
                    <div className="mx-auto w-full max-w-6xl space-y-4 min-w-0 safe-px sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
