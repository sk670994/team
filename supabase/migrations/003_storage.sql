-- PR-03 / 003_storage.sql
-- Supabase Storage bucket and object policies.

insert into storage.buckets (id, name, public)
values ('workspace-files', 'workspace-files', false)
on conflict (id) do nothing;

create or replace function public.workspace_id_from_storage_path(path text)
returns uuid
language plpgsql
immutable
as $$
declare
  workspace_part text;
begin
  workspace_part := split_part(path, '/', 1);

  if workspace_part ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return workspace_part::uuid;
  end if;

  return null;
end;
$$;

drop policy if exists "workspace_files_select_member" on storage.objects;
create policy "workspace_files_select_member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'workspace-files'
  and public.is_workspace_member(public.workspace_id_from_storage_path(name))
);

drop policy if exists "workspace_files_insert_member" on storage.objects;
create policy "workspace_files_insert_member"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'workspace-files'
  and public.is_workspace_member(public.workspace_id_from_storage_path(name))
);

drop policy if exists "workspace_files_delete_uploader_or_owner" on storage.objects;
create policy "workspace_files_delete_uploader_or_owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'workspace-files'
  and (
    public.is_workspace_owner(public.workspace_id_from_storage_path(name))
    or exists (
      select 1
      from public.files f
      where f.file_path = name
        and f.uploaded_by = auth.uid()
    )
  )
);
