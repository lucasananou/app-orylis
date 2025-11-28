// app/api/guide/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { knowledgeArticles, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { knowledgeArticleUpdateSchema } from "@/lib/zod-schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/guide/[id] — Récupère un article
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const routeParams = "then" in ctx.params ? await ctx.params : ctx.params;
  const articleId = routeParams.id;

  const article = await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      category: knowledgeArticles.category,
      published: knowledgeArticles.published,
      createdAt: knowledgeArticles.createdAt,
      updatedAt: knowledgeArticles.updatedAt,
      authorId: knowledgeArticles.authorId,
      authorName: profiles.fullName
    })
    .from(knowledgeArticles)
    .leftJoin(profiles, eq(knowledgeArticles.authorId, profiles.id))
    .where(eq(knowledgeArticles.id, articleId))
    .then((rows) => rows.at(0));

  if (!article) {
    return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  }

  // Les clients ne peuvent voir que les articles publiés
  if (!isStaff(session.user.role) && !article.published) {
    return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      published: article.published,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      authorName: article.authorName ?? "Inconnu"
    }
  });
}

// PATCH /api/guide/[id] — Met à jour un article (staff uniquement)
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (!isStaff(session.user.role)) {
    return NextResponse.json({ error: "Accès réservé au staff." }, { status: 403 });
  }

  const routeParams = "then" in ctx.params ? await ctx.params : ctx.params;
  const articleId = routeParams.id;

  const body = await req.json().catch(() => null);
  const parsed = knowledgeArticleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db.query.knowledgeArticles.findFirst({
    where: (a, { eq }) => eq(a.id, articleId)
  });

  if (!existing) {
    return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  }

  await db
    .update(knowledgeArticles)
    .set(parsed.data)
    .where(eq(knowledgeArticles.id, articleId));

  const updated = await db.query.knowledgeArticles.findFirst({
    where: (a, { eq }) => eq(a.id, articleId)
  });

  return NextResponse.json({
    ok: true,
    data: updated
      ? {
          id: updated.id,
          title: updated.title,
          content: updated.content,
          category: updated.category,
          published: updated.published,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString()
        }
      : null
  });
}

// DELETE /api/guide/[id] — Supprime un article (staff uniquement)
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (!isStaff(session.user.role)) {
    return NextResponse.json({ error: "Accès réservé au staff." }, { status: 403 });
  }

  const routeParams = "then" in ctx.params ? await ctx.params : ctx.params;
  const articleId = routeParams.id;

  const existing = await db.query.knowledgeArticles.findFirst({
    where: (a, { eq }) => eq(a.id, articleId)
  });

  if (!existing) {
    return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  }

  await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, articleId));

  return NextResponse.json({ ok: true, deletedId: articleId });
}

