import type { Metadata } from "next/types";
import { InviteProspectForm } from "@/components/admin/invite-prospect-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteClientForm } from "@/components/admin/invite-client-form";

export const metadata: Metadata = {
    title: "Inviter un utilisateur | Orylis Admin",
    description: "Créez un compte prospect ou client et envoyez une invitation."
};

export default function InvitePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invitation Rapide</h1>
                <p className="text-muted-foreground">
                    Envoyez une invitation à un prospect ou un client existant.
                </p>
            </div>

            <div className="max-w-md">
                <Tabs defaultValue="prospect" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="prospect">Nouveau Prospect</TabsTrigger>
                        <TabsTrigger value="client">Client Existant</TabsTrigger>
                    </TabsList>
                    <TabsContent value="prospect">
                        <InviteProspectForm />
                    </TabsContent>
                    <TabsContent value="client">
                        <InviteClientForm />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
