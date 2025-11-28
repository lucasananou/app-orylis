import type { Route } from "next";
import Link from "next/link";
import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeArticles, profiles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { BookOpen, Plus } from "lucide-react";

// Cache les articles pendant 5 minutes (contenu qui change peu souvent)
export const revalidate = 300;

// Cache la session pour éviter les appels multiples
const getCachedSession = cache(async () => {
  return await auth();
});

async function loadGuideData() {
  const session = await getCachedSession();
  if (!session?.user) {
    redirect("/login");
  }

  const staff = isStaff(session.user.role);

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
    .where(staff ? undefined : eq(knowledgeArticles.published, true))
    .orderBy(desc(knowledgeArticles.createdAt));

  const categories = Array.from(
    new Set(articles.map((a) => a.category).filter(Boolean))
  ) as string[];

  return {
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      published: article.published,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      authorName: article.authorName ?? "Inconnu"
    })),
    categories
  };
}

export default async function GuidePage(): Promise<JSX.Element> {
  const session = await getCachedSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { articles, categories } = await loadGuideData();
  const staff = isStaff(session.user.role);

  return (
    <>
      <PageHeader
        title="Guide"
        description="Base de connaissances et tutoriels pour vous accompagner dans l'utilisation de votre espace client."
        actions={
          <div className="flex items-center gap-3">
            {staff && (
              <Button asChild>
                <Link href="/guide/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel article
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {articles.length === 0 ? (
        <Card className="border border-border/70">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Aucun article disponible</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {staff
                ? "Créez votre premier article pour commencer à aider vos clients."
                : "Des tutoriels pour vous aider à prendre en main votre espace client seront bientôt disponibles ici. En attendant, n'hésitez pas à ouvrir un ticket si vous avez des questions."}
            </p>
            {staff && (
              <Button asChild>
                <Link href="/guide/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un article
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="border border-border/70 transition hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-2 text-lg">{article.title}</CardTitle>
                  {!article.published && staff && (
                    <span className="text-xs text-muted-foreground">Brouillon</span>
                  )}
                </div>
                {article.category && (
                  <CardDescription className="text-xs uppercase tracking-wide">
                    {article.category}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                  {article.content.substring(0, 150)}...
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/guide/${article.id}`}>Lire l'article</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
