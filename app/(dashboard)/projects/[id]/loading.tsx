import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";

export default function ProjectDetailLoading(): JSX.Element {
  return (
    <>
      <PageHeader
        title={<Skeleton className="h-8 w-48" />}
        description={<Skeleton className="h-4 w-64 mt-2" />}
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader className="space-y-2">
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-48" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-40" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

