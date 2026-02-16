"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createWorkspaceAction(formData: FormData) {
  const name = getField(formData, "name");

  if (!name) {
    redirect("/dashboard?error=Workspace%20name%20is%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_workspace", { p_name: name });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=Workspace%20created");
}

export async function joinWorkspaceAction(formData: FormData) {
  const inviteCode = getField(formData, "invite_code");

  if (!inviteCode) {
    redirect("/dashboard?error=Invite%20code%20is%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_workspace_by_invite", {
    p_invite_code: inviteCode,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=Workspace%20joined");
}

export async function deleteWorkspaceAction(formData: FormData) {
  const workspaceId = getField(formData, "workspace_id");

  if (!workspaceId) {
    redirect("/dashboard?error=Workspace%20id%20is%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("workspaces").delete().eq("id", workspaceId);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=Workspace%20deleted");
}
