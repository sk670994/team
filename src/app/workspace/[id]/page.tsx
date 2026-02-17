import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FilesList, type WorkspaceFileItem } from "@/components/files/files-list";
import { UploadFileForm } from "@/components/files/upload-file-form";
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

type WorkspaceMemberRow = {
  user_id: string;
  role: "owner" | "member";
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
};

type NoteRow = NoteItem;
type FileRow = WorkspaceFileItem;

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
  const { data: filesData, error: filesError } = await supabase
    .from("files")
    .select("id,file_name,file_path,uploaded_by,created_at")
    .eq("workspace_id", workspaceRow.id)
    .order("created_at", { ascending: false });

  const files = (filesData ?? []) as FileRow[];
  const { data: membersData, error: membersError } = await supabase
    .from("workspace_members")
    .select("user_id,role,created_at")
    .eq("workspace_id", workspaceRow.id)
    .order("created_at", { ascending: true });

  const members = ((membersData ?? []) as WorkspaceMemberRow[]).sort((a, b) => {
    if (a.role === b.role) return 0;
    return a.role === "owner" ? -1 : 1;
  });
  const memberIds = members.map((member) => member.user_id);
  const { data: profilesData } =
    memberIds.length > 0
      ? await supabase.from("profiles").select("id,full_name").in("id", memberIds)
      : { data: [] as ProfileRow[] };

  const profileMap = new Map(
    ((profilesData ?? []) as ProfileRow[]).map((profile) => [profile.id, profile.full_name])
  );

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
            <p className="text-sm">
              <span className="font-medium">Success:</span> {pageParams.message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {pageParams.error ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {pageParams.error}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {notesError ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {notesError.message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {filesError ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {filesError.message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {membersError ? (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <span className="font-medium">Error:</span> {membersError.message}
            </p>
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
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                Upload, download, and delete files with member and owner role checks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadFileForm workspaceId={workspaceRow.id} />
            </CardContent>
          </Card>
          <FilesList
            workspaceId={workspaceRow.id}
            files={files}
            currentUserId={user.id}
            isOwner={isOwner}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>All members currently in this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {profileMap.get(member.user_id) ?? "Unknown user"}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{member.user_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                        {member.user_id === user.id ? " (you)" : ""}
                      </p>
                    </div>
                    <span className="rounded-md border px-2 py-1 text-xs font-medium uppercase">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
