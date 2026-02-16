-- PR-03 / 002_rls_policies.sql
-- Row Level Security helpers and policies.

create or replace function public.is_workspace_member(workspace_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_uuid
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(workspace_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = workspace_uuid
      and w.owner_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.notes enable row level security;
alter table public.files enable row level security;

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
on public.workspaces
for update
to authenticated
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

drop policy if exists "workspaces_delete_owner" on public.workspaces;
create policy "workspaces_delete_owner"
on public.workspaces
for delete
to authenticated
using (public.is_workspace_owner(id));

drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_members_insert_owner" on public.workspace_members;
create policy "workspace_members_insert_owner"
on public.workspace_members
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_members_update_owner" on public.workspace_members;
create policy "workspace_members_update_owner"
on public.workspace_members
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_members_delete_owner" on public.workspace_members;
create policy "workspace_members_delete_owner"
on public.workspace_members
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

drop policy if exists "notes_select_member" on public.notes;
create policy "notes_select_member"
on public.notes
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "notes_insert_member" on public.notes;
create policy "notes_insert_member"
on public.notes
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

drop policy if exists "notes_update_creator_or_owner" on public.notes;
create policy "notes_update_creator_or_owner"
on public.notes
for update
to authenticated
using (
  created_by = auth.uid()
  or public.is_workspace_owner(workspace_id)
)
with check (
  public.is_workspace_member(workspace_id)
  and (
    created_by = auth.uid()
    or public.is_workspace_owner(workspace_id)
  )
);

drop policy if exists "notes_delete_creator_or_owner" on public.notes;
create policy "notes_delete_creator_or_owner"
on public.notes
for delete
to authenticated
using (
  created_by = auth.uid()
  or public.is_workspace_owner(workspace_id)
);

drop policy if exists "files_select_member" on public.files;
create policy "files_select_member"
on public.files
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "files_insert_member" on public.files;
create policy "files_insert_member"
on public.files
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and uploaded_by = auth.uid()
);

drop policy if exists "files_update_uploader_or_owner" on public.files;
create policy "files_update_uploader_or_owner"
on public.files
for update
to authenticated
using (
  uploaded_by = auth.uid()
  or public.is_workspace_owner(workspace_id)
)
with check (
  public.is_workspace_member(workspace_id)
  and (
    uploaded_by = auth.uid()
    or public.is_workspace_owner(workspace_id)
  )
);

drop policy if exists "files_delete_uploader_or_owner" on public.files;
create policy "files_delete_uploader_or_owner"
on public.files
for delete
to authenticated
using (
  uploaded_by = auth.uid()
  or public.is_workspace_owner(workspace_id)
);
