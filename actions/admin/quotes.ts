"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, profiles, quotes, authUsers, userCredentials } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { generateQuotePDF } from "@/lib/quote-generator";
import { sendQuoteCreatedEmail } from "@/lib/emails";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";

export async function generateAdminQuote(projectId: string) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    try {
        // 1. Récupérer le projet
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
            columns: {
                id: true,
                name: true,
                ownerId: true
            }
        });

        if (!project) {
            return { error: "Projet introuvable." };
        }

        // 2. Vérifier si un devis existe déjà pour ce projet
        const existingQuote = await db.query.quotes.findFirst({
            where: eq(quotes.projectId, project.id),
            columns: {
                id: true,
                status: true,
                number: true,
                pdfUrl: true
            }
        });

        if (existingQuote) {
            // Si le devis est en attente, on peut le renvoyer
            if (existingQuote.status === "pending") {
                const quoteNumber = (existingQuote.number ?? 0).toString().padStart(6, "0");
                await sendQuoteCreatedEmail(project.ownerId, project.name, existingQuote.pdfUrl, quoteNumber, existingQuote.id);
                return {
                    success: true,
                    message: "Devis déjà existant, renvoi de l'email effectué.",
                    quoteId: existingQuote.id
                };
            }
            return { error: "Un devis existe déjà pour ce projet." };
        }

        // 3. Récupérer les informations du prospect
        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.id, project.ownerId),
            columns: {
                fullName: true,
                company: true,
                phone: true
            }
        });

        const authUser = await db.query.authUsers.findFirst({
            where: eq(authUsers.id, project.ownerId),
            columns: {
                email: true,
                name: true
            }
        });

        const prospectName = profile?.fullName ?? authUser?.name ?? "Client";
        const prospectEmail = authUser?.email ?? "";
        const companyName = profile?.company ?? null;

        if (!prospectEmail) {
            return { error: "L'email du prospect est manquant." };
        }

        // 4. Générer le numéro de devis séquentiel
        const lastQuote = await db.query.quotes.findFirst({
            orderBy: (quotes, { desc }) => [desc(quotes.number)],
            columns: { number: true }
        });

        const nextNumber = (lastQuote?.number ?? 0) + 1;
        const quoteNumber = nextNumber.toString().padStart(6, "0");

        // 5. Générer le PDF
        const pdfUrl = await generateQuotePDF({
            prospectName,
            prospectEmail,
            prospectPhone: profile?.phone ?? null,
            companyName,
            projectName: project.name,
            quoteNumber
        });

        // 6. Créer le devis en base de données
        const [newQuote] = await db
            .insert(quotes)
            .values({
                projectId: project.id,
                pdfUrl,
                number: nextNumber,
                status: "pending"
            })
            .returning({ id: quotes.id });

        // 7. Envoyer l'email au prospect
        await sendQuoteCreatedEmail(project.ownerId, project.name, pdfUrl, quoteNumber, newQuote.id);

        revalidatePath("/admin/prospects");
        revalidatePath("/admin/quotes");
        revalidatePath(`/admin/clients/${project.ownerId}`);

        return {
            success: true,
            message: "Devis généré et envoyé avec succès.",
            quoteId: newQuote.id
        };
    } catch (error) {
        console.error("[generateAdminQuote] Error:", error);
        return { error: "Erreur lors de la génération du devis." };
    }
}

export async function createStandaloneQuote(data: {
    fullName: string;
    email: string;
    company?: string;
    projectName: string;
    amount?: number;
    services?: string[];
    delay?: string;
    pdfUrl?: string; // Si déjà uploadé manuellement
}) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    try {
        console.log("[createStandaloneQuote] Checking user:", data.email);
        // 1. Vérifier si l'utilisateur existe déjà
        let userId: string;
        const existingUser = await db.query.authUsers.findFirst({
            where: eq(authUsers.email, data.email),
            columns: { id: true }
        });

        if (existingUser) {
            userId = existingUser.id;

            // S'assurer que le profil existe aussi (cas d'un utilisateur sans profil)
            const existingProfile = await db.query.profiles.findFirst({
                where: eq(profiles.id, userId)
            });

            if (!existingProfile) {
                await db.insert(profiles).values({
                    id: userId,
                    fullName: data.fullName,
                    company: data.company || null,
                    role: "prospect"
                });
            }
        } else {
            // Création du "shadow account"
            userId = randomUUID();
            const password = randomUUID().replace(/-/g, "").slice(0, 12); // Password temporaire
            const passwordHash = await hash(password, 12);

            await db.insert(authUsers).values({
                id: userId,
                email: data.email,
                name: data.fullName
            });

            await db.insert(profiles).values({
                id: userId,
                fullName: data.fullName,
                company: data.company || null,
                role: "prospect"
            });

            await db.insert(userCredentials).values({
                userId,
                passwordHash
            });
        }

        // 2. Créer un nouveau projet pour ce devis
        console.log("[createStandaloneQuote] Creating project for user:", userId);
        const [project] = await db.insert(projects).values({
            ownerId: userId,
            name: data.projectName,
            status: "onboarding",
            progress: 0
        }).returning({ id: projects.id, name: projects.name });

        // 3. Générer le numéro de devis
        const lastQuote = await db.query.quotes.findFirst({
            orderBy: (quotes, { desc }) => [desc(quotes.number)],
            columns: { number: true }
        });

        const nextNumber = (lastQuote?.number ?? 0) + 1;
        const quoteNumber = nextNumber.toString().padStart(6, "0");

        // 4. Générer le PDF (si non fourni)
        let pdfUrl = data.pdfUrl;
        if (!pdfUrl) {
            pdfUrl = await generateQuotePDF({
                prospectName: data.fullName,
                prospectEmail: data.email,
                companyName: data.company || null,
                projectName: data.projectName,
                quoteNumber,
                amount: data.amount,
                services: data.services,
                delay: data.delay
            });
        }

        // 5. Créer le devis
        console.log("[createStandaloneQuote] Inserting quote record");
        const [newQuote] = await db.insert(quotes).values({
            projectId: project.id,
            pdfUrl,
            number: nextNumber,
            status: "pending",
            amount: data.amount ? Math.round(data.amount * 100) : null, // Store in cents
            services: data.services,
            delay: data.delay
        }).returning({ id: quotes.id });

        // 6. Envoyer l'email
        console.log("[createStandaloneQuote] Sending email");
        await sendQuoteCreatedEmail(userId, project.name, pdfUrl, quoteNumber, newQuote.id);

        revalidatePath("/admin/quotes");
        revalidatePath("/admin/prospects");

        console.log("[createStandaloneQuote] Success!");
        return {
            success: true,
            message: "Devis créé et envoyé avec succès.",
            quoteId: newQuote.id
        };
    } catch (error) {
        console.error("[createStandaloneQuote] Error:", error);
        return { error: `Erreur : ${error instanceof Error ? error.message : "Inconnue"}` };
    }
}

export async function relaunchQuote(quoteId: string) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    try {
        const quoteData = await db
            .select({
                id: quotes.id,
                status: quotes.status,
                number: quotes.number,
                pdfUrl: quotes.pdfUrl,
                ownerId: projects.ownerId,
                projectName: projects.name
            })
            .from(quotes)
            .innerJoin(projects, eq(quotes.projectId, projects.id))
            .where(eq(quotes.id, quoteId))
            .limit(1);

        const quote = quoteData[0];

        if (!quote) return { error: "Devis introuvable" };
        if (quote.status !== "pending") return { error: "Seuls les devis en attente peuvent être relancés" };

        const quoteNumber = (quote.number ?? 0).toString().padStart(6, "0");
        await sendQuoteCreatedEmail(
            quote.ownerId,
            quote.projectName,
            quote.pdfUrl,
            quoteNumber,
            quote.id
        );

        return { success: true, message: "Relance envoyée avec succès" };
    } catch (error) {
        console.error("[relaunchQuote] Error:", error);
        return { error: "Erreur lors de la relance" };
    }
}

export async function deleteQuote(quoteId: string) {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
        return { error: "Non autorisé" };
    }

    try {
        await db.delete(quotes).where(eq(quotes.id, quoteId));
        revalidatePath("/admin/quotes");
        return { success: true, message: "Devis supprimé avec succès" };
    } catch (error) {
        console.error("[deleteQuote] Error:", error);
        return { error: "Erreur lors de la suppression" };
    }
}
