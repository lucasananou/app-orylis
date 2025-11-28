import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user || !user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { priceId, projectId, serviceType } = body;

        if (!priceId || !projectId || !serviceType) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify project ownership
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return new NextResponse("Project not found", { status: 404 });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                projectId: projectId,
                serviceType: serviceType,
                userId: user.id
            },
            customer_email: user.email,
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/services?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/services?canceled=true`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
