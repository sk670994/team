-- PR-04 / 004_workspace_invites_and_rpc.sql
-- Invite code support and RPC helpers for workspace create/join flows.

alter table public.workspaces
add column if not exists invite_code text;

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  generated text;
begin
  loop
    generated := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
    exit when not exists (
      select 1
      from public.workspaces w
      where w.invite_code = generated
    );
  end loop;

  return generated;
end;
$$;

update public.workspaces
set invite_code = public.generate_invite_code()
where invite_code is null;

alter table public.workspaces
alter column invite_code set not null;

create unique index if not exists idx_workspaces_invite_code
on public.workspaces (invite_code);

create or replace function public.create_workspace(p_name text)
returns table (workspace_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  created_workspace_id uuid;
  created_invite_code text;
begin
  uid := auth.uid();

  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Workspace name is required';
  end if;

  insert into public.workspaces (name, owner_id, invite_code)
  values (trim(p_name), uid, public.generate_invite_code())
  returning id, workspaces.invite_code
  into created_workspace_id, created_invite_code;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace_id, uid, 'owner')
  on conflict on constraint workspace_members_workspace_id_user_id_key do nothing;

  return query
  select created_workspace_id as workspace_id, created_invite_code as invite_code;
end;
$$;

create or replace function public.join_workspace_by_invite(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  target_workspace_id uuid;
begin
  uid := auth.uid();

  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if trim(coalesce(p_invite_code, '')) = '' then
    raise exception 'Invite code is required';
  end if;

  select w.id
  into target_workspace_id
  from public.workspaces w
  where w.invite_code = upper(trim(p_invite_code));

  if target_workspace_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (target_workspace_id, uid, 'member')
  on conflict on constraint workspace_members_workspace_id_user_id_key do nothing;

  return target_workspace_id;
end;
$$;

grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.join_workspace_by_invite(text) to authenticated;
