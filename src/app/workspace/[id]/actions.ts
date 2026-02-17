"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MembershipRole = "owner" | "member";

type NoteAccessRow = {
  id: string;
  workspace_id: string;
  created_by: string;
};

function getField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function redirectWorkspaceError(workspaceId: string, message: string) {
  redirect(`/workspace/${workspaceId}?error=${encodeMessage(message)}`);
}

function redirectWorkspaceMessage(workspaceId: string, message: string) {
  redirect(`/workspace/${workspaceId}?message=${encodeMessage(message)}`);
}

async function getMembershipRole(workspaceId: string, userId: string): Promise<MembershipRole | null> {
  const supabase = await createClient();

  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (membership?.role as MembershipRole | undefined) ?? null;
}

async function requireUserAndWorkspace(formData: FormData) {
  const workspaceId = getField(formData, "workspace_id");

  if (!workspaceId) {
    redirect("/dashboard?error=Workspace%20id%20is%20required");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { workspaceId, userId: user.id, supabase };
}

export async function createNoteAction(formData: FormData) {
  const { workspaceId, userId, supabase } = await requireUserAndWorkspace(formData);
  const title = getField(formData, "title");
  const content = getField(formData, "content");

  if (!title) {
    redirectWorkspaceError(workspaceId, "Note title is required");
  }

  if (!content) {
    redirectWorkspaceError(workspaceId, "Note content is required");
  }

  const role = await getMembershipRole(workspaceId, userId);
  if (!role) {
    redirectWorkspaceError(workspaceId, "You do not have access to this workspace");
  }

  const { error } = await supabase.from("notes").insert({
    workspace_id: workspaceId,
    title,
    content,
    created_by: userId,
  });

  if (error) {
    redirectWorkspaceError(workspaceId, error.message);
  }

  revalidatePath(`/workspace/${workspaceId}`);
  redirectWorkspaceMessage(workspaceId, "Note created");
}

export async function updateNoteAction(formData: FormData) {
  const { workspaceId, userId, supabase } = await requireUserAndWorkspace(formData);
  const noteId = getField(formData, "note_id");
  const title = getField(formData, "title");
  const content = getField(formData, "content");

  if (!noteId) {
    redirectWorkspaceError(workspaceId, "Note id is required");
  }

  if (!title) {
    redirectWorkspaceError(workspaceId, "Note title is required");
  }

  if (!content) {
    redirectWorkspaceError(workspaceId, "Note content is required");
  }

  const role = await getMembershipRole(workspaceId, userId);
  if (!role) {
    redirectWorkspaceError(workspaceId, "You do not have access to this workspace");
  }

  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id,workspace_id,created_by")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError) {
    redirectWorkspaceError(workspaceId, noteError.message);
  }

  if (!note) {
    redirectWorkspaceError(workspaceId, "Note not found");
  }

  const noteRow = note as NoteAccessRow;
  if (noteRow.workspace_id !== workspaceId) {
    redirectWorkspaceError(workspaceId, "Invalid workspace for note update");
  }

  const canManage = role === "owner" || noteRow.created_by === userId;
  if (!canManage) {
    redirectWorkspaceError(workspaceId, "You do not have permission to edit this note");
  }

  const { error: updateError } = await supabase
    .from("notes")
    .update({
      title,
      content,
    })
    .eq("id", noteId);

  if (updateError) {
    redirectWorkspaceError(workspaceId, updateError.message);
  }

  revalidatePath(`/workspace/${workspaceId}`);
  redirectWorkspaceMessage(workspaceId, "Note updated");
}

export async function deleteNoteAction(formData: FormData) {
  const { workspaceId, userId, supabase } = await requireUserAndWorkspace(formData);
  const noteId = getField(formData, "note_id");

  if (!noteId) {
    redirectWorkspaceError(workspaceId, "Note id is required");
  }

  const role = await getMembershipRole(workspaceId, userId);
  if (!role) {
    redirectWorkspaceError(workspaceId, "You do not have access to this workspace");
  }

  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id,workspace_id,created_by")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError) {
    redirectWorkspaceError(workspaceId, noteError.message);
  }

  if (!note) {
    redirectWorkspaceError(workspaceId, "Note not found");
  }

  const noteRow = note as NoteAccessRow;
  if (noteRow.workspace_id !== workspaceId) {
    redirectWorkspaceError(workspaceId, "Invalid workspace for note delete");
  }

  const canManage = role === "owner" || noteRow.created_by === userId;
  if (!canManage) {
    redirectWorkspaceError(workspaceId, "You do not have permission to delete this note");
  }

  const { error: deleteError } = await supabase.from("notes").delete().eq("id", noteId);

  if (deleteError) {
    redirectWorkspaceError(workspaceId, deleteError.message);
  }

  revalidatePath(`/workspace/${workspaceId}`);
  redirectWorkspaceMessage(workspaceId, "Note deleted");
}
