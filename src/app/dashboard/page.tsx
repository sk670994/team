import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteWorkspaceAction } from "@/app/dashboard/actions";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import { JoinWorkspaceDialog } from "@/components/workspaces/join-workspace-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type WorkspaceRecord = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
};

type WorkspaceMembershipRow = {
  role: "owner" | "member";
  workspaces: WorkspaceRecord | WorkspaceRecord[];
};

function normalizeWorkspace(workspaces: WorkspaceMembershipRow["workspaces"]): WorkspaceRecord | null {
  if (Array.isArray(workspaces)) {
    return workspaces[0] ?? null;
  }
  return workspaces ?? null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces!inner(id,name,owner_id,invite_code,created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const memberships = (data ?? []) as WorkspaceMembershipRow[];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace Dashboard</CardTitle>
          <CardDescription>
            Create or join workspaces, then manage access-aware actions by role.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <CreateWorkspaceDialog />
          <JoinWorkspaceDialog />
        </CardContent>
      </Card>

      {params.message ? (
        <Card className="border-green-300">
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="font-medium">Success:</span> {params.message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {params.error ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {params.error}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {error.message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {memberships.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No workspaces yet</CardTitle>
              <CardDescription>Create one or join with an invite code.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          memberships.map(({ role, workspaces }) => {
            const workspace = normalizeWorkspace(workspaces);
            if (!workspace) return null;

            const isOwner = role === "owner";

            return (
              <Card key={workspace.id}>
                <CardHeader>
                  <CardTitle>{workspace.name}</CardTitle>
                  <CardDescription>
                    Role: {role} | Created: {new Date(workspace.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isOwner ? (
                    <p className="text-sm text-muted-foreground">
                      Invite code: <span className="font-mono text-foreground">{workspace.invite_code}</span>
                    </p>
                  ) : null}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/workspace/${workspace.id}`}>Open workspace</Link>
                  </Button>
                  {isOwner ? (
                    <form action={deleteWorkspaceAction}>
                      <input type="hidden" name="workspace_id" value={workspace.id} />
                      <ConfirmSubmitButton
                        type="submit"
                        variant="destructive"
                        size="sm"
                        confirmMessage="Delete this workspace? This action cannot be undone."
                        pendingText="Deleting..."
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
