-- FinLens — simplify roles to Admin / Member, lock accounts + income_sources
-- writes to Admin only. Reads stay open to any household member.
-- Safe to re-run.

-- 1. Add 'Member' to the role enum (PostgreSQL allows additive changes)
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'family_role' and e.enumlabel = 'Member'
  ) then
    alter type family_role add value 'Member';
  end if;
end$$;

-- 2. Helper: is the current user an Admin in a given household?
create or replace function public.is_household_admin(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from family_members
    where household_id = hh
      and user_id = auth.uid()
      and role = 'Admin'
  );
$$;

-- 3. Replace the generic "all members can write" policy on accounts &
--    income_sources with read-for-members + write-for-admins.
drop policy if exists "accounts_select"        on accounts;
drop policy if exists "accounts_write"         on accounts;
drop policy if exists "income_sources_select"  on income_sources;
drop policy if exists "income_sources_write"   on income_sources;

create policy "accounts_select" on accounts
  for select to authenticated
  using (is_household_member(household_id));

create policy "accounts_write" on accounts
  for all to authenticated
  using (is_household_admin(household_id))
  with check (is_household_admin(household_id));

create policy "income_sources_select" on income_sources
  for select to authenticated
  using (is_household_member(household_id));

create policy "income_sources_write" on income_sources
  for all to authenticated
  using (is_household_admin(household_id))
  with check (is_household_admin(household_id));
