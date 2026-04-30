-- FinLens — RPC that returns each category's budget + spent for the
-- current month in a single round-trip.
--
-- Replaces 3 sequential client queries:
--   transactions (sum group by category) + monthly_budgets + category_budgets
--
-- Caller must already be a member of the household; we enforce that via
-- the existing is_household_member() helper from policies.sql.

create or replace function public.get_category_spend_for_month(p_household_id uuid)
returns table (
  category_id uuid,
  slug        text,
  label       text,
  icon        text,
  color       text,
  budget      numeric,
  spent       numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with month_start as (
    select date_trunc('month', current_date)::date as d
  ),
  spend as (
    select t.category_id, sum(t.amount)::numeric as spent
    from transactions t, month_start ms
    where t.household_id = p_household_id
      and t.txn_date >= ms.d
      and t.category_id is not null
    group by t.category_id
  ),
  budgets as (
    select cb.category_id, cb.amount::numeric as budget
    from monthly_budgets mb
    join category_budgets cb on cb.monthly_budget_id = mb.id
    cross join month_start ms
    where mb.household_id = p_household_id
      and mb.period_month = ms.d
  )
  select
    c.id        as category_id,
    c.slug,
    c.label,
    c.icon,
    c.color,
    coalesce(b.budget, 0)::numeric as budget,
    coalesce(s.spent,  0)::numeric as spent
  from categories c
  left join spend   s on s.category_id = c.id
  left join budgets b on b.category_id = c.id
  where c.household_id = p_household_id
  order by c.label;
$$;

-- Allow authenticated users to call it (RLS on the underlying tables
-- still applies because it's `security invoker`).
grant execute on function public.get_category_spend_for_month(uuid) to authenticated;
