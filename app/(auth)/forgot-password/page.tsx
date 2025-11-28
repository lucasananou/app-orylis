"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth-reset";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const result = await requestPasswordReset(formData);

            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: result.error,
                });
            } else {
                setIsSubmitted(true);
                toast({
                    title: "Email envoyé",
                    description: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
                });
            }
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

    if (isSubmitted) {
        return (
            <div className="container flex h-screen w-screen flex-col items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-100 p-3">
                                <Mail className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-center">Vérifiez vos emails</CardTitle>
                        <CardDescription className="text-center">
                            Si un compte existe avec cette adresse, nous vous avons envoyé un lien pour réinitialiser votre mot de passe.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button variant="ghost" asChild>
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour à la connexion
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Mot de passe oublié ?</CardTitle>
                    <CardDescription>
                        Entrez votre adresse email pour recevoir un lien de réinitialisation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    placeholder="nom@exemple.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Envoyer le lien
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button variant="link" size="sm" asChild className="text-muted-foreground">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour à la connexion
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
