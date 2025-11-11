import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "./profile-form";

const session = await auth();

if (!session?.user) {
  redirect("/login");
}

const profile = await db.query.profiles.findFirst({
  where: eq(profiles.id, session.user.id),
  columns: {
    fullName: true,
    company: true,
    phone: true
  }
});

export default function ProfilePage(): JSX.Element {
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
    </>
  );
}

