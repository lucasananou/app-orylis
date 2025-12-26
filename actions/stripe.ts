"use server";

import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function createCheckoutSession(priceAmount: number, serviceTitle: string) {
    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: serviceTitle,
                    },
                    unit_amount: priceAmount * 100, // Stripe expects amount in cents
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: `${origin}/marketplace/success`,
        cancel_url: `${origin}/marketplace`,
    });

    if (session.url) {
        redirect(session.url);
    }
}
