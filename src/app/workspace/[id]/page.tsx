import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type WorkspacePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>Protected workspace route placeholder for ID: {id}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Notes, files, and members UI will be added in the next PRs.
        </p>
      </CardContent>
    </Card>
  );
}
