import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions, profiles, projects, authUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
// import { promoteProspectToClient } from "@/lib/actions";

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
          // 1. Mettre à jour le rôle du profil
          await db
            .update(profiles)
            .set({ role: "client" })
            .where(eq(profiles.id, userId));

          // 2. Mettre à jour le statut du projet
          // On le remet explicitement à "onboarding" pour être sûr que le client tombe sur le formulaire
          await db
            .update(projects)
            .set({ status: "onboarding" })
            .where(eq(projects.id, projectId));

          console.log("[Webhook] User promoted to client and project set to onboarding");

          // Fetch project name for email
          const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
            columns: { name: true, ownerId: true }
          });

          if (project) {
            // --- Generate Invoice ---
            try {
              // 1. Get next invoice number
              const lastInvoice = await db.query.invoices.findFirst({
                orderBy: (invoices, { desc }) => [desc(invoices.number)],
              });
              const nextNumber = (lastInvoice?.number ?? 2024000) + 1;

              // 2. Get client info
              const clientProfile = await db.query.profiles.findFirst({
                where: eq(profiles.id, userId),
                columns: { fullName: true, company: true }
              });
              const clientUser = await db.query.authUsers.findFirst({
                where: eq(authUsers.id, userId),
                columns: { name: true }
              });

              const clientName = clientProfile?.company || clientProfile?.fullName || clientUser?.name || "Client";

              // 3. Generate PDF
              const { generateInvoicePdf } = await import("@/lib/invoice-generator");
              const amount = session.amount_total ? session.amount_total / 100 : 500;

              const pdfUrl = await generateInvoicePdf({
                invoiceNumber: nextNumber.toString(),
                date: new Date(),
                clientName,
                projectName: project.name,
                description: `Acompte sur création site internet - Projet ${project.name}`,
                amount,
                type: "deposit"
              });

              // 4. Save to DB
              const { invoices } = await import("@/lib/schema");
              await db.insert(invoices).values({
                projectId,
                userId,
                number: nextNumber,
                amount: session.amount_total || 50000, // Store in cents
                status: "paid",
                type: "deposit",
                pdfUrl
              });

              console.log("[Webhook] Invoice generated:", nextNumber);

            } catch (invError) {
              console.error("[Webhook] Error generating invoice:", invError);
            }

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
