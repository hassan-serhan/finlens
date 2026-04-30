-- FinLens — Per-household quiz reward overrides
-- Run AFTER education_tables.sql. Lets each household admin set a custom
-- wallet reward per topic (overrides the platform default on edu_topics).

create table if not exists edu_household_rewards (
  household_id uuid not null references households(id) on delete cascade,
  topic_id uuid not null references edu_topics(id) on delete cascade,
  reward_amount numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (household_id, topic_id)
);

alter table edu_household_rewards enable row level security;

-- Members can read their household's rewards.
create policy "members read edu_household_rewards" on edu_household_rewards
  for select using (is_household_member(household_id));

-- Only admins can insert/update/delete.
create policy "admins write edu_household_rewards" on edu_household_rewards
  for all using (
    exists (
      select 1 from family_members fm
      where fm.household_id = edu_household_rewards.household_id
        and fm.user_id = auth.uid()
        and fm.role = 'Admin'
    )
  );
