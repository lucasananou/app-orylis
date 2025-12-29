"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateImpersonationToken } from "@/actions/admin/impersonate";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

interface ImpersonateButtonProps {
    userId: string;
    userName: string;
}

export function ImpersonateButton({ userId, userName }: ImpersonateButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleImpersonate = async () => {
        if (!confirm(`Voulez-vous vraiment vous connecter en tant que ${userName} ?`)) return;

        setIsLoading(true);
        try {
            const res = await generateImpersonationToken(userId);

            if (res.error || !res.token) {
                toast.error(res.error || "Erreur inconnue");
                setIsLoading(false);
                return;
            }

            // Sign in using the token
            // We pass the token as a custom credential. 
            // Note: The email field is required by typical credentials provider but we can pass a dummy one if our logic handles it.
            // Actually, we modified auth.ts to accept impersonationToken.
            const result = await signIn("credentials", {
                redirect: false,
                email: "impersonation@orylis.app", // Dummy email to satisfy basic checks if any
                password: "dummy", // Dummy password
                impersonationToken: res.token,
            });

            if (result?.error) {
                toast.error("Échec de la connexion");
                setIsLoading(false);
            } else {
                toast.success(`Connecté en tant que ${userName}`);
                window.location.href = "/"; // Redirect to dashboard
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur système");
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleImpersonate}
            disabled={isLoading}
            className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800"
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Se connecter en tant que
        </Button>
    );
}
