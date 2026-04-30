-- FinLens — Atomic signup trigger (bootstrap household + admin member).
-- Skips when the new user was created via the invite-member edge function,
-- which sets `invited = true` in both app_metadata and user_metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hh_id uuid;
  v_member_id uuid;
  v_full_name text;
  v_first text;
begin
  -- ---------- Skip checks ----------
  -- 1. Invite flag (app_metadata is server-only, can't be spoofed by users).
  if coalesce(new.raw_app_meta_data->>'invited', 'false') = 'true' then
    return new;
  end if;
  -- 2. Mirror flag in user_metadata as a belt-and-braces.
  if coalesce(new.raw_user_meta_data->>'invited', 'false') = 'true' then
    return new;
  end if;
  -- 3. Defensive: if a family_members row already exists for this user
  --    (e.g. inserted by the edge function before the trigger fired in some
  --    future race), do not bootstrap a second household.
  if exists (select 1 from family_members where user_id = new.id) then
    return new;
  end if;

  -- ---------- Bootstrap ----------
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Admin');
  v_first := split_part(v_full_name, ' ', 1);

  -- 1. Household
  insert into households (name, created_by)
  values (v_first || '''s family', new.id)
  returning id into v_hh_id;

  -- 2. Admin family member
  insert into family_members
    (household_id, user_id, name, role, relation,
     initials, avatar, xp, level, invite_status)
  values
    (v_hh_id, new.id, v_full_name, 'Admin', 'Parent',
     upper(left(v_first, 1)), null, 0, 'Money Mentor', 'active')
  returning id into v_member_id;

  -- 3. Full admin permissions
  insert into member_permissions
    (member_id, view_expenses, add_expenses, view_goals,
     contribute_goals, view_debts, manage_members)
  values
    (v_member_id, true, true, true, true, true, true);

  -- 4. Main + savings accounts
  insert into accounts (household_id, kind, name, sub, icon, balance, tone)
  values
    (v_hh_id, 'main',    'Main Account',    'For everyday expenses', '💳', 0, 'dark'),
    (v_hh_id, 'savings', 'Savings Account', 'Powering your goals',   '🏦', 0, 'tint');

  -- 5. Default spending categories
  insert into categories (household_id, slug, label, icon, color) values
    (v_hh_id, 'groceries', 'Groceries', '🛒', '#25D366'),
    (v_hh_id, 'dining',    'Dining',    '🍽️', '#F0B429'),
    (v_hh_id, 'transport', 'Transport', '🚗', '#4D8DE5'),
    (v_hh_id, 'utilities', 'Utilities', '💡', '#A78BFA'),
    (v_hh_id, 'kids',      'Kids',      '🎒', '#E5484D'),
    (v_hh_id, 'leisure',   'Leisure',   '🎟️', '#14B8A6');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
