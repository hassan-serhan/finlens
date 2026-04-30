-- FinLens — Performance indexes.
-- Idempotent: each statement is `if not exists`. Safe to run repeatedly.
-- The bare schema in SUPABASE_SCHEMA.md adds some of these already; this
-- file makes sure every hot query path is covered, and adds the ones we
-- only realised we needed once features started landing.

-- transactions ----------------------------------------------------------
-- listTransactions filters by household + txn_date range, sorted desc
create index if not exists idx_transactions_household_date
  on transactions (household_id, txn_date desc);

-- listTransactions with member filter
create index if not exists idx_transactions_household_member_date
  on transactions (household_id, member_id, txn_date desc);

-- get_category_spend_for_month groups by category for the month
create index if not exists idx_transactions_household_category_date
  on transactions (household_id, category_id, txn_date);

-- categories ------------------------------------------------------------
create index if not exists idx_categories_household
  on categories (household_id);

-- family_members --------------------------------------------------------
-- find caller's row by user_id (every page boot)
create index if not exists idx_family_members_user
  on family_members (user_id);

-- list members of a household
create index if not exists idx_family_members_household
  on family_members (household_id);

-- accounts --------------------------------------------------------------
create index if not exists idx_accounts_household_kind
  on accounts (household_id, kind);

-- income_sources --------------------------------------------------------
create index if not exists idx_income_sources_household_date
  on income_sources (household_id, income_date desc);

-- monthly_budgets / category_budgets -----------------------------------
create index if not exists idx_monthly_budgets_household_period
  on monthly_budgets (household_id, period_month);

create index if not exists idx_category_budgets_monthly
  on category_budgets (monthly_budget_id);

create index if not exists idx_category_budgets_category
  on category_budgets (category_id);

-- allowance_entries -----------------------------------------------------
create index if not exists idx_allowance_entries_wallet_date
  on allowance_entries (wallet_id, entry_date desc);

-- households ------------------------------------------------------------
create index if not exists idx_households_created_by
  on households (created_by);
