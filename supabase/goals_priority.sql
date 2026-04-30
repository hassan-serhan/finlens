-- FinLens — add priority + description to savings_goals and debts.
-- Safe to re-run.

alter table savings_goals
  add column if not exists priority text not null default 'medium'
  check (priority in ('high', 'medium', 'low'));

alter table savings_goals
  add column if not exists description text;

alter table debts
  add column if not exists priority text not null default 'medium'
  check (priority in ('high', 'medium', 'low'));

alter table debts
  add column if not exists description text;

create index if not exists idx_goal_contributions_goal_date
  on goal_contributions (goal_id, contributed_at desc);

create index if not exists idx_debt_payments_debt_date
  on debt_payments (debt_id, paid_at desc);

create index if not exists idx_savings_goals_household
  on savings_goals (household_id, created_at desc);

create index if not exists idx_debts_household
  on debts (household_id, created_at desc);
