// app/api/guide/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { knowledgeArticles, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { knowledgeArticleCreateSchema } from "@/lib/zod-schemas";

export const dynamic = "force-dynamic";

// GET /api/guide — Liste les articles publiés (ou tous si staff)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const includeUnpublished = searchParams.get("includeUnpublished") === "true";

  const staff = isStaff(session.user.role);
  const showUnpublished = staff && includeUnpublished;

  const whereConditions = [];
  
  if (!showUnpublished) {
    whereConditions.push(eq(knowledgeArticles.published, true));
  }
  
  if (category) {
    whereConditions.push(eq(knowledgeArticles.category, category));
  }

  const articles = await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      category: knowledgeArticles.category,
      published: knowledgeArticles.published,
      createdAt: knowledgeArticles.createdAt,
      updatedAt: knowledgeArticles.updatedAt,
      authorName: profiles.fullName
    })
    .from(knowledgeArticles)
    .leftJoin(profiles, eq(knowledgeArticles.authorId, profiles.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(knowledgeArticles.createdAt));

  return NextResponse.json({
    data: articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      published: article.published,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      authorName: article.authorName ?? "Inconnu"
    }))
  });
}

// POST /api/guide — Crée un nouvel article (staff uniquement)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (!isStaff(session.user.role)) {
    return NextResponse.json({ error: "Accès réservé au staff." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = knowledgeArticleCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(knowledgeArticles)
    .values({
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category ?? null,
      published: parsed.data.published ?? true,
      authorId: session.user.id
    })
    .returning({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      category: knowledgeArticles.category,
      published: knowledgeArticles.published,
      createdAt: knowledgeArticles.createdAt,
      updatedAt: knowledgeArticles.updatedAt
    });

  return NextResponse.json({
    ok: true,
    data: {
      id: created.id,
      title: created.title,
      content: created.content,
      category: created.category,
      published: created.published,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    }
  });
}

