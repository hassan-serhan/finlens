-- One-time cleanup for invited members that ended up with TWO family_members
-- rows (one in the inviter's household, one in an auto-bootstrapped household)
-- because the trigger ran before the invited-skip flag was added.
--
-- Strategy:
--   For each user with >1 family_members row, keep the row in the household
--   they did NOT create (i.e. the inviter's household) and drop the household
--   they created themselves. Cascading FKs wipe the orphan household's
--   accounts, categories, etc.
--
-- Idempotent: re-running after cleanup is a no-op.

with dupes as (
  select user_id
  from family_members
  where user_id is not null
  group by user_id
  having count(*) > 1
),
orphan_households as (
  -- The household this duplicated user CREATED (`created_by = user_id`).
  -- That's the bootstrap household to drop; the other one is the inviter's.
  select h.id
  from households h
  join dupes d on d.user_id = h.created_by
)
delete from households
where id in (select id from orphan_households);

-- Sanity check after running:
--   select user_id, count(*) from family_members
--   where user_id is not null
--   group by user_id having count(*) > 1;
-- (should return 0 rows)
