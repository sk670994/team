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

type FileAccessRow = {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  file_path: string;
};

const WORKSPACE_FILES_BUCKET = "workspace-files";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function redirectWorkspaceError(workspaceId: string, message: string): never {
  redirect(`/workspace/${workspaceId}?error=${encodeMessage(message)}`);
}

function redirectWorkspaceMessage(workspaceId: string, message: string): never {
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

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadFileAction(formData: FormData) {
  const { workspaceId, userId, supabase } = await requireUserAndWorkspace(formData);
  const role = await getMembershipRole(workspaceId, userId);

  if (!role) {
    redirectWorkspaceError(workspaceId, "You do not have access to this workspace");
  }

  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;

  if (!file || file.size === 0) {
    redirectWorkspaceError(workspaceId, "Please select a file to upload");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    redirectWorkspaceError(workspaceId, "File size exceeds 10MB limit");
  }

  const originalFileName = file.name.trim();
  if (!originalFileName) {
    redirectWorkspaceError(workspaceId, "Invalid file name");
  }

  const safeFileName = sanitizeFileName(originalFileName);
  const filePath = `${workspaceId}/${crypto.randomUUID()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    redirectWorkspaceError(workspaceId, uploadError.message);
  }

  const { error: insertError } = await supabase.from("files").insert({
    workspace_id: workspaceId,
    file_name: originalFileName,
    file_path: filePath,
    uploaded_by: userId,
  });

  if (insertError) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([filePath]);
    redirectWorkspaceError(workspaceId, insertError.message);
  }

  revalidatePath(`/workspace/${workspaceId}`);
  redirectWorkspaceMessage(workspaceId, "File uploaded");
}

export async function downloadFileAction(formData: FormData) {
  const { workspaceId, userId, supabase } = await requireUserAndWorkspace(formData);
  const fileId = getField(formData, "file_id");

  if (!fileId) {
    redirectWorkspaceError(workspaceId, "File id is required");
  }

  const role = await getMembershipRole(workspaceId, userId);
  if (!role) {
    redirectWorkspaceError(workspaceId, "You do not have access to this workspace");
  }

  const { data: fileRecord, error: fileError } = await supabase
    .from("files")
    .select("id,workspace_id,uploaded_by,file_path")
    .eq("id", fileId)
    .maybeSingle();

  if (fileError) {
    redirectWorkspaceError(workspaceId, fileError.message);
  }

  if (!fileRecord) {
    redirectWorkspaceError(workspaceId, "File not found");
  }

  const fileRow = fileRecord as FileAccessRow;
  if (fileRow.workspace_id !== workspaceId) {
    redirectWorkspaceError(workspaceId, "Invalid workspace for file download");
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .createSignedUrl(fileRow.file_path, 60);

  if (signedError || !signedData?.signedUrl) {
    redirectWorkspaceError(workspaceId, signedError?.message ?? "Unable to generate download URL");
  }

  redirect(signedData.signedUrl);
}

export async function deleteFileAction(formData: FormData) {
  const { workspaceId, userId, supabase } = await requireUserAndWorkspace(formData);
  const fileId = getField(formData, "file_id");

  if (!fileId) {
    redirectWorkspaceError(workspaceId, "File id is required");
  }

  const role = await getMembershipRole(workspaceId, userId);
  if (!role) {
    redirectWorkspaceError(workspaceId, "You do not have access to this workspace");
  }

  const { data: fileRecord, error: fileError } = await supabase
    .from("files")
    .select("id,workspace_id,uploaded_by,file_path")
    .eq("id", fileId)
    .maybeSingle();

  if (fileError) {
    redirectWorkspaceError(workspaceId, fileError.message);
  }

  if (!fileRecord) {
    redirectWorkspaceError(workspaceId, "File not found");
  }

  const fileRow = fileRecord as FileAccessRow;
  if (fileRow.workspace_id !== workspaceId) {
    redirectWorkspaceError(workspaceId, "Invalid workspace for file delete");
  }

  const canManage = role === "owner" || fileRow.uploaded_by === userId;
  if (!canManage) {
    redirectWorkspaceError(workspaceId, "You do not have permission to delete this file");
  }

  const { error: storageDeleteError } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .remove([fileRow.file_path]);

  if (storageDeleteError) {
    redirectWorkspaceError(workspaceId, storageDeleteError.message);
  }

  const { error: metadataDeleteError } = await supabase.from("files").delete().eq("id", fileId);
  if (metadataDeleteError) {
    redirectWorkspaceError(workspaceId, metadataDeleteError.message);
  }

  revalidatePath(`/workspace/${workspaceId}`);
  redirectWorkspaceMessage(workspaceId, "File deleted");
}
