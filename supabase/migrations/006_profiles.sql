-- PR-09 / 006_profiles.sql
-- User profiles for display names shown in workspace member lists.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_shared_workspace" on public.profiles;
create policy "profiles_select_shared_workspace"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_members me
    join public.workspace_members target
      on target.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and target.user_id = profiles.id
  )
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  if display_name = '' then
    display_name := split_part(coalesce(new.email, ''), '@', 1);
  end if;
  if display_name = '' then
    display_name := 'User';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, display_name)
  on conflict (id) do update
    set full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists trg_create_profile_on_auth_user on auth.users;
create trigger trg_create_profile_on_auth_user
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

-- Backfill profile rows for users created before this migration.
insert into public.profiles (id, full_name)
select
  u.id,
  case
    when trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')) <> '' then trim(u.raw_user_meta_data ->> 'full_name')
    when split_part(coalesce(u.email, ''), '@', 1) <> '' then split_part(u.email, '@', 1)
    else 'User'
  end as full_name
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);
