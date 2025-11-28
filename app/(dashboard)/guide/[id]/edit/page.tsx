import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeArticles } from "@/lib/schema";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ArticleEditor } from "@/components/guide/article-editor";

export const dynamic = "force-dynamic";

interface EditArticlePageProps {
  params: {
    id: string;
  };
}

async function loadArticle(id: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!isStaff(session.user.role)) {
    redirect("/guide");
  }

  const article = await db.query.knowledgeArticles.findFirst({
    where: (a, { eq }) => eq(a.id, id)
  });

  return article
    ? {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      published: article.published
    }
    : null;
}

export default async function EditArticlePage(props: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!isStaff(session.user.role)) {
    redirect("/guide");
  }

  const article = await loadArticle(params.id);

  if (!article) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Modifier l'article"
        description={`Édition de "${article.title}"`}
      />
      <ArticleEditor mode="edit" article={article} />
    </>
  );
}

