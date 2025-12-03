import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authUsers, projects, onboardingResponses, profiles, userCredentials } from "@/lib/schema";
import { PublicOnboardingSchema } from "@/lib/zod-schemas";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = PublicOnboardingSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Données invalides", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { firstName, lastName, email, ...onboardingData } = result.data;

        // 1. Check if user exists
        const existingUser = await db.query.authUsers.findFirst({
            where: eq(authUsers.email, email),
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Un compte existe déjà avec cet email." },
                { status: 409 }
            );
        }

        // 2. Create User
        const password = randomUUID(); // Generate a random password
        const hashedPassword = await hash(password, 10);
        const userId = randomUUID();

        // 3. Create Project
        const projectId = randomUUID();

        await db.transaction(async (tx) => {
            // Insert User (authUsers)
            await tx.insert(authUsers).values({
                id: userId,
                email,
                emailVerified: new Date(), // Optional but good practice
            });

            // Insert Profile
            await tx.insert(profiles).values({
                id: userId, // profiles.id references authUsers.id
                role: "prospect",
                fullName: `${firstName} ${lastName}`,
                company: onboardingData.companyName,
                phone: onboardingData.phone,
            });

            // Insert Credentials
            await tx.insert(userCredentials).values({
                userId,
                passwordHash: hashedPassword,
            });
            await tx.insert(projects).values({
                id: projectId,
                ownerId: userId,
                name: onboardingData.companyName,
                status: "demo_in_progress",
                progress: 10,
            });

            // 4. Save Onboarding Data
            await tx.insert(onboardingResponses).values({
                projectId,
                payload: onboardingData,
                completed: true,
                type: "prospect",
            });

            // 5. Trigger Webhooks (Fire and Forget) - Moved outside transaction
        });

        // --- Post-Transaction Actions ---

        const webhookPayload = {
            userId,
            projectId,
            email,
            firstName,
            lastName,
            ...onboardingData,
            source: "public_onboarding"
        };

        // Send confirmation email
        const { sendProspectOnboardingCompletedEmail, sendWelcomeEmail } = await import("@/lib/emails");

        // 1. Send Account Created Email (with password)
        const email1 = await sendWelcomeEmail(userId, onboardingData.companyName, { email, password });

        // 2. Send Onboarding Completed Email (Demo in progress)
        const email2 = await sendProspectOnboardingCompletedEmail(userId, onboardingData.companyName);

        // Brevo Nurturing Webhook
        fetch("https://hook.eu2.make.com/6inqljar2or4jxl74uprzx4s15nucgjj", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
        }).catch(console.error);

        // n8n Demo Creation Webhook
        fetch("https://orylis.app.n8n.cloud/webhook/3bc9c601-c3b6-422b-9f1e-90c2b576c761", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
        }).catch(console.error);

        return NextResponse.json({
            success: true,
            email,
            password,
            debug: {
                email1: email1,
                email2: email2
            }
        });
    } catch (error) {
        console.error("Public onboarding error:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue lors de l'inscription." },
            { status: 500 }
        );
    }
}
