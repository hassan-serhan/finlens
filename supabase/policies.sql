-- FinLens — Row-Level Security policies
-- Run this AFTER the schema in SUPABASE_SCHEMA.md is created.
-- Safe to re-run: each statement is wrapped with DROP IF EXISTS.

-- ============================================================
-- Helper: is the current auth user a member of this household?
-- ============================================================
create or replace function public.is_household_member(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from family_members
    where household_id = hh and user_id = auth.uid()
  );
$$;

-- ============================================================
-- Enable RLS on every household-scoped table
-- ============================================================
alter table households            enable row level security;
alter table family_members        enable row level security;
alter table member_permissions    enable row level security;
alter table accounts              enable row level security;
alter table income_sources        enable row level security;
alter table categories            enable row level security;
alter table monthly_budgets       enable row level security;
alter table category_budgets      enable row level security;
alter table transactions          enable row level security;
alter table savings_goals         enable row level security;
alter table goal_contributions    enable row level security;
alter table debts                 enable row level security;
alter table debt_payments         enable row level security;
alter table allowance_wallets     enable row level security;
alter table allowance_entries     enable row level security;
alter table member_topic_progress enable row level security;
alter table quiz_attempts         enable row level security;
alter table member_badges         enable row level security;
alter table activity_events       enable row level security;

-- ============================================================
-- households
-- INSERT: any authenticated user, as long as they set themselves as creator.
-- SELECT/UPDATE: members of the household.
-- ============================================================
drop policy if exists "households_insert_self"   on households;
drop policy if exists "households_select_member" on households;
drop policy if exists "households_update_member" on households;

-- No INSERT policy — the on_auth_user_created trigger creates the household
-- atomically on signup (security definer, bypasses RLS).
create policy "households_select_member" on households
  for select to authenticated
  using (is_household_member(id));

create policy "households_update_member" on households
  for update to authenticated
  using (is_household_member(id));

-- ============================================================
-- family_members
-- INSERT: allowed when (a) inserting yourself into a household you created,
--   or (b) you are already an Admin in that household (adding kids/spouse).
-- SELECT/UPDATE/DELETE: members of the same household.
-- ============================================================
drop policy if exists "family_members_insert"     on family_members;
drop policy if exists "family_members_select"     on family_members;
drop policy if exists "family_members_update"     on family_members;
drop policy if exists "family_members_delete"     on family_members;

-- INSERT: only Admins can add new members from the client.
-- Self-insert is handled by the on_auth_user_created trigger
-- (security definer, so it bypasses RLS). See supabase/signup_trigger.sql.
create policy "family_members_insert" on family_members
  for insert to authenticated
  with check (
    exists (select 1 from family_members admin
            where admin.household_id = family_members.household_id
              and admin.user_id = auth.uid()
              and admin.role = 'Admin')
  );

create policy "family_members_select" on family_members
  for select to authenticated
  using (is_household_member(household_id));

create policy "family_members_update" on family_members
  for update to authenticated
  using (is_household_member(household_id));

create policy "family_members_delete" on family_members
  for delete to authenticated
  using (
    exists (select 1 from family_members admin
            where admin.household_id = family_members.household_id
              and admin.user_id = auth.uid()
              and admin.role = 'Admin')
  );

-- ============================================================
-- Generic policy template for "anything tied to a household_id".
-- Members can read; Admin/Editor can write.
-- ============================================================
do $$
declare
  tbl text;
  household_tables text[] := array[
    'accounts', 'income_sources', 'categories',
    'monthly_budgets', 'transactions',
    'savings_goals', 'debts', 'allowance_wallets',
    'activity_events'
  ];
begin
  foreach tbl in array household_tables loop
    execute format('drop policy if exists "%1$s_select" on %1$s', tbl);
    execute format('drop policy if exists "%1$s_write"  on %1$s', tbl);

    execute format($f$
      create policy "%1$s_select" on %1$s
        for select to authenticated
        using (is_household_member(household_id))
    $f$, tbl);

    execute format($f$
      create policy "%1$s_write" on %1$s
        for all to authenticated
        using (is_household_member(household_id))
        with check (is_household_member(household_id))
    $f$, tbl);
  end loop;
end$$;

-- ============================================================
-- Tables tied to a household indirectly (via parent FK).
-- ============================================================

-- category_budgets — gated through monthly_budgets.household_id
drop policy if exists "category_budgets_all" on category_budgets;
create policy "category_budgets_all" on category_budgets
  for all to authenticated
  using (
    exists (select 1 from monthly_budgets mb
            where mb.id = category_budgets.monthly_budget_id
              and is_household_member(mb.household_id))
  )
  with check (
    exists (select 1 from monthly_budgets mb
            where mb.id = category_budgets.monthly_budget_id
              and is_household_member(mb.household_id))
  );

-- goal_contributions — gated through savings_goals.household_id
drop policy if exists "goal_contributions_all" on goal_contributions;
create policy "goal_contributions_all" on goal_contributions
  for all to authenticated
  using (
    exists (select 1 from savings_goals g
            where g.id = goal_contributions.goal_id
              and is_household_member(g.household_id))
  )
  with check (
    exists (select 1 from savings_goals g
            where g.id = goal_contributions.goal_id
              and is_household_member(g.household_id))
  );

-- debt_payments — gated through debts.household_id
drop policy if exists "debt_payments_all" on debt_payments;
create policy "debt_payments_all" on debt_payments
  for all to authenticated
  using (
    exists (select 1 from debts d
            where d.id = debt_payments.debt_id
              and is_household_member(d.household_id))
  )
  with check (
    exists (select 1 from debts d
            where d.id = debt_payments.debt_id
              and is_household_member(d.household_id))
  );

-- allowance_entries — gated through allowance_wallets.household_id
drop policy if exists "allowance_entries_all" on allowance_entries;
create policy "allowance_entries_all" on allowance_entries
  for all to authenticated
  using (
    exists (select 1 from allowance_wallets w
            where w.id = allowance_entries.wallet_id
              and is_household_member(w.household_id))
  )
  with check (
    exists (select 1 from allowance_wallets w
            where w.id = allowance_entries.wallet_id
              and is_household_member(w.household_id))
  );

-- member_permissions — gated through family_members.household_id
drop policy if exists "member_permissions_all" on member_permissions;
create policy "member_permissions_all" on member_permissions
  for all to authenticated
  using (
    exists (select 1 from family_members fm
            where fm.id = member_permissions.member_id
              and is_household_member(fm.household_id))
  )
  with check (
    exists (select 1 from family_members fm
            where fm.id = member_permissions.member_id
              and is_household_member(fm.household_id))
  );

-- member_topic_progress / quiz_attempts / member_badges — gated via member
do $$
declare
  tbl text;
  member_tables text[] := array['member_topic_progress', 'quiz_attempts', 'member_badges'];
begin
  foreach tbl in array member_tables loop
    execute format('drop policy if exists "%1$s_all" on %1$s', tbl);
    execute format($f$
      create policy "%1$s_all" on %1$s
        for all to authenticated
        using (
          exists (select 1 from family_members fm
                  where fm.id = %1$s.member_id
                    and is_household_member(fm.household_id))
        )
        with check (
          exists (select 1 from family_members fm
                  where fm.id = %1$s.member_id
                    and is_household_member(fm.household_id))
        )
    $f$, tbl);
  end loop;
end$$;

-- ============================================================
-- Global catalog tables: read-only for anyone signed in.
-- ============================================================
alter table topics  enable row level security;
alter table lessons enable row level security;
alter table quiz_questions enable row level security;
alter table badges enable row level security;

drop policy if exists "topics_read" on topics;
drop policy if exists "lessons_read" on lessons;
drop policy if exists "quiz_questions_read" on quiz_questions;
drop policy if exists "badges_read" on badges;

create policy "topics_read"        on topics        for select to authenticated using (true);
create policy "lessons_read"       on lessons       for select to authenticated using (true);
create policy "quiz_questions_read" on quiz_questions for select to authenticated using (true);
create policy "badges_read"        on badges        for select to authenticated using (true);
