import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateNoteDialog } from "@/components/notes/create-note-dialog";
import { NotesList, type NoteItem } from "@/components/notes/notes-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type WorkspacePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type WorkspaceRow = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
};

type MembershipRow = {
  role: "owner" | "member";
};

type NoteRow = NoteItem;

export default async function WorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    redirect("/dashboard?error=Unable%20to%20verify%20workspace%20access");
  }

  if (!membership) {
    redirect("/dashboard?error=You%20do%20not%20have%20access%20to%20this%20workspace");
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id,name,owner_id,invite_code,created_at")
    .eq("id", id)
    .maybeSingle();

  if (workspaceError) {
    redirect("/dashboard?error=Unable%20to%20load%20workspace");
  }

  if (!workspace) {
    notFound();
  }

  const membershipRow = membership as MembershipRow;
  const workspaceRow = workspace as WorkspaceRow;
  const isOwner = membershipRow.role === "owner";
  const pageParams = await searchParams;

  const { data: notesData, error: notesError } = await supabase
    .from("notes")
    .select("id,title,content,created_by,created_at")
    .eq("workspace_id", workspaceRow.id)
    .order("created_at", { ascending: false });

  const notes = (notesData ?? []) as NoteRow[];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{workspaceRow.name}</CardTitle>
              <CardDescription>
                Workspace ID: <span className="font-mono">{workspaceRow.id}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border px-2 py-1 text-xs font-medium uppercase">
                {membershipRow.role}
              </span>
              <Button asChild variant="outline">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Created on {new Date(workspaceRow.created_at).toLocaleDateString()}.
          </p>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? `Owner actions enabled. Invite code: ${workspaceRow.invite_code}`
              : "Member access enabled. Owner-only actions are restricted."}
          </p>
        </CardContent>
      </Card>

      {pageParams.message ? (
        <Card className="border-green-300">
          <CardContent className="p-4">
            <p className="text-sm">{pageParams.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {pageParams.error ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{pageParams.error}</p>
          </CardContent>
        </Card>
      ) : null}

      {notesError ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{notesError.message}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Create notes and manage creator/owner edit and delete permissions.
                  </CardDescription>
                </div>
                <CreateNoteDialog workspaceId={workspaceRow.id} />
              </div>
            </CardHeader>
          </Card>
          <NotesList
            workspaceId={workspaceRow.id}
            notes={notes}
            currentUserId={user.id}
            isOwner={isOwner}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>File upload/list/delete will be added in PR-07.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This section will contain workspace file upload and management.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Member management UI placeholder.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Invite/member list controls will be added in a follow-up PR.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
