-- One-time cleanup for the duplicate households created during the
-- failed bootstrap attempts. Safe to run multiple times.
--
-- Strategy: keep the OLDEST household per creator, delete the rest.
-- Cascade deletes handle accounts/categories/etc. tied to the dropped rows.

with ranked as (
  select
    id,
    created_by,
    row_number() over (partition by created_by order by created_at) as rn
  from households
  where created_by is not null
)
delete from households
where id in (select id from ranked where rn > 1);

-- Sanity check after cleanup:
-- select created_by, count(*) from households group by created_by order by 2 desc;
