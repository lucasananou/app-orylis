"use server";

import { db } from "@/lib/db";
import { authUsers, passwordResetTokens, userCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { sendPasswordResetEmail } from "@/lib/emails";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get("email") as string;

    if (!email) {
        return { error: "Email requis" };
    }

    try {
        // 1. Vérifier si l'utilisateur existe
        const user = await db.query.authUsers.findFirst({
            where: eq(authUsers.email, email),
            columns: { id: true }
        });

        if (!user) {
            // On ne révèle pas si l'email existe ou non pour la sécurité
            return { success: true };
        }

        // 2. Créer un token de reset
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 heure

        // Supprimer les anciens tokens pour cet utilisateur
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

        // Insérer le nouveau token
        await db.insert(passwordResetTokens).values({
            userId: user.id,
            token,
            expiresAt
        });

        // 3. Envoyer l'email
        await sendPasswordResetEmail(email, token);

        return { success: true };
    } catch (error) {
        console.error("Error requesting password reset:", error);
        return { error: "Une erreur est survenue" };
    }
}

export async function resetPassword(formData: FormData) {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !password || !confirmPassword) {
        return { error: "Tous les champs sont requis" };
    }

    if (password !== confirmPassword) {
        return { error: "Les mots de passe ne correspondent pas" };
    }

    if (password.length < 8) {
        return { error: "Le mot de passe doit faire au moins 8 caractères" };
    }

    try {
        // 1. Vérifier le token
        const resetToken = await db.query.passwordResetTokens.findFirst({
            where: eq(passwordResetTokens.token, token),
            with: {
                user: true // On aura besoin de l'ID utilisateur
            }
        });

        if (!resetToken) {
            return { error: "Lien invalide ou expiré" };
        }

        if (new Date() > resetToken.expiresAt) {
            return { error: "Lien expiré" };
        }

        // 2. Hasher le nouveau mot de passe
        const passwordHash = await hash(password, 12);

        // 3. Mettre à jour le mot de passe
        // Vérifier si l'utilisateur a déjà des credentials
        const existingCredentials = await db.query.userCredentials.findFirst({
            where: eq(userCredentials.userId, resetToken.userId)
        });

        if (existingCredentials) {
            await db
                .update(userCredentials)
                .set({ passwordHash, updatedAt: new Date() })
                .where(eq(userCredentials.userId, resetToken.userId));
        } else {
            await db.insert(userCredentials).values({
                userId: resetToken.userId,
                passwordHash
            });
        }

        // 4. Supprimer le token utilisé
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

    } catch (error) {
        console.error("Error resetting password:", error);
        return { error: "Une erreur est survenue" };
    }

    // Redirection hors du try/catch car cela lance une erreur NEXT_REDIRECT
    redirect("/login?reset=success");
}
