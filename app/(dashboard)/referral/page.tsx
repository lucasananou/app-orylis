import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Users, Sparkles, Mail, CheckCircle2, Clock } from "lucide-react";
import { ReferralCopyButton } from "@/components/referral/referral-copy-button";
import { redirect } from "next/navigation";

export default async function ReferralPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const referrals = await db.query.profiles.findMany({
        where: eq(profiles.referrerId, session.user.id),
        columns: {
            id: true,
            fullName: true,
            company: true,
            role: true,
            createdAt: true
        },
        orderBy: (profile, { desc }) => desc(profile.createdAt)
    });

    return (
        <>
            <PageHeader
                title="Parrainage"
                description="Invitez vos partenaires et profitez d'avantages exclusifs."
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Hero Card */}
                <Card className="border-primary/20 bg-primary/5 lg:col-span-2">
                    <CardContent className="flex flex-col items-center text-center p-8 sm:p-12">
                        <div className="rounded-full bg-primary/10 p-4 mb-6">
                            <Gift className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                            Gagnez jusqu'à 340€ par parrainage
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-lg mb-8">
                            Devenez apporteur d'affaires : touchez <strong>15% de commission</strong> sur chaque projet signé grâce à vous.
                            <br className="hidden sm:block" />
                            Soit environ <strong>220€</strong> pour un Site Vitrine et <strong>340€</strong> pour un E-commerce.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button size="lg" className="rounded-full" asChild>
                                <a href="mailto:?subject=Recommandation%20Orylis&body=Hello%2C%0A%0AJe%20te%20recommande%20Orylis%20pour%20la%20cr%C3%A9ation%20de%20ton%20site%20web.%20Ils%20ont%20fait%20du%20super%20boulot%20pour%20moi.%0A%0ASi%20tu%20viens%20de%20ma%20part%2C%20tu%20b%C3%A9n%C3%A9ficieras%20d'une%20attention%20particuli%C3%A8re%20!%0A%0AContacte-les%20ici%20%3A%20contact%40orylis.fr">
                                    <Mail className="mr-2 h-5 w-5" />
                                    Inviter par email
                                </a>
                            </Button>
                            <ReferralCopyButton userId={session.user.id} />
                        </div>
                    </CardContent>
                </Card>

                {/* How it works */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Comment ça marche ?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="font-medium">Recommandez Orylis</h3>
                                <p className="text-sm text-muted-foreground">
                                    Partagez votre expérience à votre réseau (amis, partenaires).
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="font-medium">Signature du devis</h3>
                                <p className="text-sm text-muted-foreground">
                                    Votre filleul valide son projet (Vitrine ou E-commerce).
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                                3
                            </div>
                            <div>
                                <h3 className="font-medium">Encaissez vos gains</h3>
                                <p className="text-sm text-muted-foreground">
                                    Recevez votre commission de 15% directement par virement.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Vos parrainages
                        </CardTitle>
                        <CardDescription>
                            Suivez ici vos recommandations validées.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {referrals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="rounded-full bg-muted p-3 mb-3">
                                    <Users className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">Aucun parrainage actif</p>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    Vos récompenses apparaîtront ici dès que vos filleuls auront signé.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {referrals.map((referral) => (
                                    <div key={referral.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">{referral.company || referral.fullName || "Filleul"}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {referral.role === "client" ? "Client signé 🎉" : "En discussion"}
                                            </p>
                                        </div>
                                        {referral.role === "client" ? (
                                            <div className="flex items-center text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Validé
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-full">
                                                <Clock className="mr-1 h-3 w-3" />
                                                En attente
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
