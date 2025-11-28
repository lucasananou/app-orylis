"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "@/app/actions/auth-reset";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    async function handleSubmit(formData: FormData) {
        if (!token) {
            toast.error("Token manquant ou invalide.");
            return;
        }

        setIsLoading(true);
        try {
            // Add token to formData
            formData.append("token", token);
            const result = await resetPassword(formData);

            if (result?.error) {
                toast.error(result.error);
            } else {
                setIsSuccess(true);
                toast.success("Mot de passe mis à jour avec succès !");
            }
        } catch (error) {
            toast.error("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-destructive">Lien invalide</CardTitle>
                    <CardDescription>
                        Le lien de réinitialisation est manquant ou invalide. Veuillez refaire une demande.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
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
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
