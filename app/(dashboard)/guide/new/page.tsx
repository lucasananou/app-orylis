import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ArticleEditor } from "@/components/guide/article-editor";

export const dynamic = "force-dynamic";

export default async function NewArticlePage(): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!isStaff(session.user.role)) {
    redirect("/guide");
  }

  return (
    <>
      <PageHeader
        title="Nouvel article"
        description="Créez un nouvel article pour la base de connaissances."
      />
      <ArticleEditor mode="create" />
    </>
  );
}

