"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "@/app/actions/auth-reset";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const result = await resetPassword(formData);

            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: result.error,
                });
            }
            // Si succès, la redirection est gérée par le server action
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Une erreur est survenue. Veuillez réessayer.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="container flex h-screen w-screen flex-col items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Lien invalide</CardTitle>
                        <CardDescription>
                            Le lien de réinitialisation est manquant ou invalide. Veuillez refaire une demande.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Nouveau mot de passe</CardTitle>
                    <CardDescription>
                        Choisissez un nouveau mot de passe sécurisé pour votre compte.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit}>
                        <input type="hidden" name="token" value={token} />
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Nouveau mot de passe</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    disabled={isLoading}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    disabled={isLoading}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <Button disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Réinitialiser le mot de passe
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
