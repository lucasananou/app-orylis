"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const inviteSchema = z.object({
    email: z.string().email({ message: "Email invalide." }),
    fullName: z.string().optional()
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InviteProspectForm() {
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [lastInvitedEmail, setLastInvitedEmail] = React.useState("");

    const form = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            email: "",
            fullName: ""
        }
    });

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const onSubmit = async (values: InviteFormValues) => {
        console.log("Form submitted with values:", values);
        try {
            const password = generatePassword();

            const response = await fetch("/api/admin/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: values.email,
                    fullName: values.fullName || undefined,
                    password,
                    passwordConfirm: password // The API might expect this if it uses the full clientCreateFormSchema, checking now...
                    // Actually the API uses clientCreateSchema which doesn't have passwordConfirm, 
                    // but let's check if the API route uses clientCreateFormSchema or clientCreateSchema.
                    // The API route uses clientCreateSchema.
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Erreur lors de l'invitation.");
            }

            setIsSuccess(true);
            setLastInvitedEmail(values.email);
            form.reset();
            toast.success("Invitation envoyée avec succès !");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Une erreur est survenue.";
            toast.error(message);
        }
    };

    if (isSuccess) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium text-green-900">Invitation envoyée !</h3>
                        <p className="text-green-700">
                            Un email contenant les accès a été envoyé à <strong>{lastInvitedEmail}</strong>.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() => setIsSuccess(false)}
                    >
                        Inviter un autre prospect
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inviter un prospect</CardTitle>
                <CardDescription>
                    Créez un compte instantanément et envoyez les accès par email.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    form={form}
                    onSubmit={(e) => {
                        e.preventDefault();
                        console.log("Form submit event triggered");
                        form.handleSubmit(onSubmit)(e);
                    }}
                    className="space-y-4"
                >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email du prospect</FormLabel>
                                <FormControl>
                                    <Input placeholder="prospect@exemple.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom complet (optionnel)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Jean Dupont" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Sera utilisé pour personnaliser l'email de bienvenue.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Envoi en cours...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Envoyer l'invitation
                            </>
                        )}
                    </Button>
                </Form>
            </CardContent>
        </Card>
    );
}
