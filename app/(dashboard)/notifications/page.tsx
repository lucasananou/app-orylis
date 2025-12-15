import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Notifications | Orylis",
    description: "Vos notifications et alertes."
};

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, session.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);

    return (
        <>
            <PageHeader
                title="Notifications"
                description="Historique de vos alertes et messages système."
            />

            <div className="space-y-4">
                {userNotifications.length === 0 ? (
                    <Card className="bg-slate-50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mb-4 opacity-20" />
                            <p>Aucune notification pour le moment.</p>
                        </CardContent>
                    </Card>
                ) : (
                    userNotifications.map((notification) => (
                        <Card key={notification.id} className={notification.read ? "opacity-70" : "border-blue-200 bg-blue-50/30"}>
                            <CardContent className="flex gap-4 p-4 md:p-6 items-start">
                                <div className="shrink-0 mt-1">
                                    {notification.type === "success" || notification.type === "onboarding_update" ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Info className="h-5 w-5 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between gap-4">
                                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {notification.body}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </>
    );
}
