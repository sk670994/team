-- PR-06 / 005_workspace_owner_membership_trigger.sql
-- Ensure every workspace has an owner membership row, including manual inserts.

create or replace function public.ensure_workspace_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict on constraint workspace_members_workspace_id_user_id_key do nothing;

  return new;
end;
$$;

drop trigger if exists trg_workspace_owner_membership on public.workspaces;
create trigger trg_workspace_owner_membership
after insert on public.workspaces
for each row
execute function public.ensure_workspace_owner_membership();

-- Backfill owner memberships for existing workspaces missing the owner row.
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'owner'
from public.workspaces w
where not exists (
  select 1
  from public.workspace_members wm
  where wm.workspace_id = w.id
    and wm.user_id = w.owner_id
);
