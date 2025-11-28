import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, quotes, profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { assertStaff, safeJson } from "@/lib/utils";
import { notifyProjectOwner } from "@/lib/notifications";
import { sendProspectDemoReadyEmailStaticTo, sendQuoteCreatedEmail } from "@/lib/emails";
import { generateQuotePDF } from "@/lib/quote-generator";

const BodySchema = z.object({
  demoUrl: z.string().min(1, "demoUrl requis"),
  status: z.enum(["onboarding", "demo_in_progress", "design", "build", "review", "delivered"]).optional()
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return safeJson({ error: "UNAUTHORIZED" }, 401);
  }

  try {
    assertStaff(session.user.role);
  } catch {
    return safeJson({ error: "FORBIDDEN" }, 403);
  }

  const { id: projectId } = await context.params;
  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return safeJson({ error: "INVALID_BODY", details: parsed.error.flatten() }, 400);
  }

  const { demoUrl, status } = parsed.data;

  // 1. Update Project
  const [updated] = await db
    .update(projects)
    .set({
      demoUrl,
      status: status ?? "demo_in_progress",
      ...(status === "demo_in_progress" ? { progress: 60 } : {})
    })
    .where(eq(projects.id, projectId))
    .returning({
      id: projects.id,
      ownerId: projects.ownerId,
      name: projects.name,
      status: projects.status,
      demoUrl: projects.demoUrl
    });

  if (!updated) {
    return safeJson({ error: "NOT_FOUND" }, 404);
  }

  // 2. Notify "Demo Ready" (In-App)
  await notifyProjectOwner(updated.id, {
    type: "onboarding_update",
    title: "Votre démo est prête",
    body: "Cliquez pour découvrir votre démo personnalisée.",
    metadata: { demoUrl: updated.demoUrl }
  }).catch(() => null);

  // 3. Email "Demo Ready" & Quote Automation
  const owner = await db.query.authUsers.findFirst({
    where: (t, { eq }) => eq(t.id, updated.ownerId),
    columns: { email: true, name: true }
  });

  if (owner?.email) {
    // A. Send Demo Ready Email
    try {
      console.log("[Demo URL] Sending Demo Ready email to:", owner.email);
      await sendProspectDemoReadyEmailStaticTo(owner.email);
    } catch (e) {
      console.error("[Demo URL] Failed to send demo ready email:", e);
    }

    // B. Quote Automation (Generate or Resend)
    try {
      console.log("[Demo URL] Checking for existing quote...");
      const existingQuote = await db.query.quotes.findFirst({
        where: eq(quotes.projectId, projectId),
        columns: { id: true, status: true, number: true, pdfUrl: true }
      });

      if (existingQuote) {
        console.log("[Demo URL] Quote exists:", existingQuote.id, "Status:", existingQuote.status);

        // If quote exists and is pending, RESEND the email
        if (existingQuote.status === "pending" && existingQuote.pdfUrl) {
          console.log("[Demo URL] Resending existing quote email...");
          const quoteNumber = (existingQuote.number ?? 0).toString().padStart(6, "0");
          await sendQuoteCreatedEmail(updated.ownerId, updated.name, existingQuote.pdfUrl, quoteNumber, existingQuote.id);
          console.log("[Demo URL] Quote email resent.");
        }
      } else {
        console.log("[Demo URL] No quote found. Generating new quote...");

        // Fetch profile for details
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.id, updated.ownerId),
          columns: { fullName: true, company: true, phone: true }
        });

        const prospectName = profile?.fullName ?? owner?.name ?? "Client";
        const companyName = profile?.company ?? null;

        // Generate Quote Number
        const lastQuote = await db.query.quotes.findFirst({
          orderBy: (quotes, { desc }) => [desc(quotes.number)],
          columns: { number: true }
        });
        const nextNumber = (lastQuote?.number ?? 0) + 1;
        const quoteNumber = nextNumber.toString().padStart(6, "0");

        // Generate PDF
        console.log("[Demo URL] Generating PDF...");
        const pdfUrl = await generateQuotePDF({
          prospectName,
          prospectEmail: owner?.email ?? "",
          prospectPhone: profile?.phone ?? null,
          companyName,
          projectName: updated.name,
          quoteNumber
        });

        // Insert Quote
        console.log("[Demo URL] Inserting quote into DB...");
        const [newQuote] = await db.insert(quotes).values({
          projectId: projectId,
          pdfUrl,
          number: nextNumber,
          status: "pending"
        }).returning({ id: quotes.id });

        // Send Email
        console.log("[Demo URL] Sending new quote email...");
        await sendQuoteCreatedEmail(updated.ownerId, updated.name, pdfUrl, quoteNumber, newQuote.id);
        console.log("[Demo URL] New quote email sent.");
      }
    } catch (error) {
      console.error("[Demo URL] Failed to auto-generate/send quote:", error);
    }
  }

  return safeJson({ ok: true, project: updated }, 200);
}
