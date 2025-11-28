import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeArticles, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/utils";
import { Edit } from "lucide-react";

export const dynamic = "force-dynamic";

interface GuideDetailPageProps {
  params: {
    id: string;
  };
}

async function loadArticle(id: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const staff = isStaff(session.user.role);

  const article = await db
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
    .where(
      staff
        ? eq(knowledgeArticles.id, id)
        : and(eq(knowledgeArticles.id, id), eq(knowledgeArticles.published, true))
    )
    .then((rows) => rows.at(0));

  return article
    ? {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      published: article.published,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      authorName: article.authorName ?? "Inconnu"
    }
    : null;
}

export default async function GuideDetailPage(props: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const article = await loadArticle(params.id);

  if (!article) {
    notFound();
  }

  const staff = isStaff(session.user.role);

  return (
    <>
      <PageHeader
        title={article.title}
        description={
          article.category
            ? `Catégorie : ${article.category}`
            : `Publié le ${formatDate(article.createdAt, { dateStyle: "medium" })}`
        }
        actions={
          <div className="flex items-center gap-3">
            {staff && (
              <Button asChild variant="outline">
                <Link href={`/guide/${article.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/guide">Retour au guide</Link>
            </Button>
          </div>
        }
      />

      <Card className="border border-border/70">
        <CardHeader>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Par {article.authorName}</span>
            <span>
              Mis à jour le {formatDate(article.updatedAt, { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-foreground">{article.content}</div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
