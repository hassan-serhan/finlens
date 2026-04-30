-- Backfill Main + Savings accounts and default categories for any household
-- that's missing them. Idempotent: only inserts what doesn't exist yet.

-- 1. Main account ($0 default) for households without one
insert into accounts (household_id, kind, name, sub, icon, balance, tone)
select h.id, 'main', 'Main Account', 'For everyday expenses', '💳', 0, 'dark'
from households h
where not exists (
  select 1 from accounts a where a.household_id = h.id and a.kind = 'main'
);

-- 2. Savings account ($0 default) for households without one
insert into accounts (household_id, kind, name, sub, icon, balance, tone)
select h.id, 'savings', 'Savings Account', 'Powering your goals', '🏦', 0, 'tint'
from households h
where not exists (
  select 1 from accounts a where a.household_id = h.id and a.kind = 'savings'
);

-- 3. Default categories for households without any categories
insert into categories (household_id, slug, label, icon, color)
select h.id, c.slug, c.label, c.icon, c.color
from households h
cross join (values
  ('groceries', 'Groceries', '🛒', '#25D366'),
  ('dining',    'Dining',    '🍽️', '#F0B429'),
  ('transport', 'Transport', '🚗', '#4D8DE5'),
  ('utilities', 'Utilities', '💡', '#A78BFA'),
  ('kids',      'Kids',      '🎒', '#E5484D'),
  ('leisure',   'Leisure',   '🎟️', '#14B8A6')
) as c(slug, label, icon, color)
where not exists (
  select 1 from categories x where x.household_id = h.id
);

-- 4. Ensure Admin family_member exists for any user who created a household
--    but doesn't yet have a member row (in case the old bootstrap died there).
insert into family_members (household_id, user_id, name, role, relation, invite_status)
select
  h.id,
  h.created_by,
  coalesce(u.raw_user_meta_data->>'full_name', u.email, 'Admin'),
  'Admin',
  'Parent',
  'active'
from households h
join auth.users u on u.id = h.created_by
where h.created_by is not null
  and not exists (
    select 1 from family_members fm
    where fm.household_id = h.id and fm.user_id = h.created_by
  );

-- 5. Full admin permissions for any Admin family_member missing them
insert into member_permissions
  (member_id, view_expenses, add_expenses, view_goals,
   contribute_goals, view_debts, manage_members)
select fm.id, true, true, true, true, true, true
from family_members fm
where fm.role = 'Admin'
  and not exists (
    select 1 from member_permissions mp where mp.member_id = fm.id
  );

-- Sanity check (run separately):
-- select h.id, h.name,
--        (select count(*) from accounts a where a.household_id = h.id) as accounts,
--        (select count(*) from categories c where c.household_id = h.id) as categories,
--        (select count(*) from family_members fm where fm.household_id = h.id) as members
-- from households h;
