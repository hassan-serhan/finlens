-- FinLens — Education tables
-- Run this in the Supabase SQL editor ONCE to bootstrap the education feature.

-- Topics are PLATFORM-WIDE (no household_id). The platform owner seeds them
-- directly in the DB / SQL editor. Household admins cannot create topics.
create table if not exists edu_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sub text,
  description text,
  icon text,
  color text,
  bg text,
  video_url text,
  lesson_count int not null default 1,
  length_label text,
  reward_amount numeric(12,2) not null default 0,
  xp_reward int not null default 500,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Quiz questions per topic (platform-wide, managed by platform owner).
create table if not exists edu_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references edu_topics(id) on delete cascade,
  position int not null default 0,
  question text not null,
  options jsonb not null,       -- ["Option A", "Option B", "Option C", "Option D"]
  correct_index int not null,   -- 0-based index into options
  created_at timestamptz not null default now()
);

create index if not exists idx_edu_questions_topic on edu_questions (topic_id, position);

-- Tracks each member's progress on a topic (0-100%).
create table if not exists edu_progress (
  member_id uuid not null references family_members(id) on delete cascade,
  topic_id uuid not null references edu_topics(id) on delete cascade,
  percent int not null default 0,
  best_score int not null default 0,
  total_questions int not null default 0,
  passed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (member_id, topic_id)
);

-- Badges earned by members (one per member per topic).
create table if not exists edu_badges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references family_members(id) on delete cascade,
  topic_id uuid not null references edu_topics(id) on delete cascade,
  badge_name text not null,
  earned_at timestamptz not null default now(),
  unique (member_id, topic_id)
);

create index if not exists idx_edu_badges_member on edu_badges (member_id);

-- RLS
alter table edu_topics enable row level security;
alter table edu_questions enable row level security;
alter table edu_progress enable row level security;
alter table edu_badges enable row level security;

-- Topics & questions: any authenticated user can read (platform-wide catalog).
create policy "anyone reads edu_topics" on edu_topics
  for select using (auth.uid() is not null);

create policy "anyone reads edu_questions" on edu_questions
  for select using (auth.uid() is not null);

-- Progress: members can read/write their own rows.
create policy "members own edu_progress" on edu_progress
  for all using (
    exists (
      select 1 from family_members fm
      where fm.id = edu_progress.member_id
        and fm.user_id = auth.uid()
    )
  );

-- Admins can read all progress in their household.
create policy "admins read edu_progress" on edu_progress
  for select using (
    exists (
      select 1 from family_members fm
      join family_members other on other.household_id = fm.household_id
      where other.id = edu_progress.member_id
        and fm.user_id = auth.uid()
        and fm.role = 'Admin'
    )
  );

-- Badges: members can read/write their own.
create policy "members own edu_badges" on edu_badges
  for all using (
    exists (
      select 1 from family_members fm
      where fm.id = edu_badges.member_id
        and fm.user_id = auth.uid()
    )
  );

-- Admins can read all badges in their household.
create policy "admins read edu_badges" on edu_badges
  for select using (
    exists (
      select 1 from family_members fm
      join family_members other on other.household_id = fm.household_id
      where other.id = edu_badges.member_id
        and fm.user_id = auth.uid()
        and fm.role = 'Admin'
    )
  );
