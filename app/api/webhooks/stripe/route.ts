import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions, profiles, projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as Stripe.Subscription;

  if (event.type === "checkout.session.completed") {
    console.log("[Webhook] Checkout session completed:", session.id);
    console.log("[Webhook] Metadata:", session.metadata);
    console.log("[Webhook] Mode:", session.mode);

    // Handle Deposit Payment (One-time payment)
    if (session.mode === "payment" && session.metadata?.type === "deposit") {
      const userId = session.metadata.userId;
      const projectId = session.metadata.projectId;
      console.log("[Webhook] Processing deposit for user:", userId, "project:", projectId);

      if (userId && projectId) {
        try {
          await db
            .update(profiles)
            .set({ role: "client" })
            .where(eq(profiles.id, userId));
          console.log("[Webhook] User role updated to client");

          // Fetch project name for email
          const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
            columns: { name: true }
          });

          if (project) {
            const { sendDepositReceivedEmail, sendDepositReceivedEmailToAdmin } = await import("@/lib/emails");
            await Promise.all([
              sendDepositReceivedEmail(userId, project.name),
              sendDepositReceivedEmailToAdmin(userId, project.name, session.amount_total ? session.amount_total / 100 : 500)
            ]);
            console.log("[Webhook] Deposit emails sent");
          }
        } catch (error) {
          console.error("[Webhook] Error processing deposit:", error);
        }
      } else {
        console.error("[Webhook] Missing userId or projectId in metadata");
      }
      return new NextResponse(null, { status: 200 });
    }

    // Handle Subscription Payment
    if (!session?.metadata?.projectId) {
      return new NextResponse("Project ID missing in metadata", { status: 400 });
    }

    const subscriptionId = session.subscription as string;

    // Retrieve the subscription details from Stripe to get the price ID and current period end
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = stripeSub.items.data[0].price.id;

    // Map price ID to service type (simple mapping based on known IDs)
    let serviceType: "seo" | "maintenance" | "blog" = "maintenance";

    if (session.metadata?.serviceType) {
      serviceType = session.metadata.serviceType as any;
    }

    await db.insert(subscriptions).values({
      projectId: session.metadata!.projectId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
      stripePriceId: priceId,
      status: "active",
      serviceType: serviceType,
      currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscriptionId = subscription.id;

    // Retrieve subscription to get latest period end
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

    await db
      .update(subscriptions)
      .set({
        status: "active",
        currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  }

  if (event.type === "customer.subscription.deleted") {
    const subscriptionId = subscription.id;
    await db
      .update(subscriptions)
      .set({
        status: "canceled"
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  }

  return new NextResponse(null, { status: 200 });
}
