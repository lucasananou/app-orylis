import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "./profile-form";
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form";
import { Edit } from "lucide-react";

// Cache le profil pendant 30 secondes (les changements sont rares)
export const revalidate = 30;

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

  return { profile, userName: user.name, userEmail: user.email };
}

export default async function ProfilePage(): Promise<JSX.Element> {
  const { profile, userName, userEmail } = await loadProfile();

  return (
    <>
      <PageHeader
        title="Profil"
        description="Vos informations servent à personnaliser les interactions avec l'équipe Orylis."
      />

      {/* Section Avatar et aperçu */}
      <Card className="mb-6 border border-border/70 bg-gradient-to-r from-accent/5 to-accent/10">
        <CardContent className="flex items-center gap-6 p-6">
          <Avatar className="h-20 w-20 ring-2 ring-accent/20">
            <AvatarFallback className="bg-accent/10 text-2xl font-semibold text-accent">
              {(userName ?? userEmail ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">
              {profile?.fullName ?? userName ?? "Utilisateur"}
            </h3>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            {profile?.company && (
              <p className="text-sm text-muted-foreground mt-1">{profile.company}</p>
            )}
          </div>
          <a href="#profile-form">
            <Button variant="outline" size="lg" className="gap-2">
              <Edit className="h-4 w-4" />
              Mettre à jour mes infos
            </Button>
          </a>
        </CardContent>
      </Card>

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

