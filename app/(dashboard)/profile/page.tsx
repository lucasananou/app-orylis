import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "./profile-form";
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form";

export const dynamic = "force-dynamic";

async function loadProfile() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user!;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    columns: {
      fullName: true,
      company: true,
      phone: true
    }
  });

  return { profile };
}

export default async function ProfilePage(): Promise<JSX.Element> {
  const { profile } = await loadProfile();

  return (
    <>
      <PageHeader
        title="Profil"
        description="Vos informations servent à personnaliser les interactions avec l’équipe Orylis."
      />

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Ces données sont privées et utilisées uniquement dans le cadre de nos échanges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              fullName: profile?.fullName ?? "",
              company: profile?.company ?? "",
              phone: profile?.phone ?? ""
            }}
          />
        </CardContent>
      </Card>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Ajustez les alertes que vous recevez dans l’application et par email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm />
        </CardContent>
      </Card>
    </>
  );
}

