-- Let signed-in learners reach their own row through the Data API.
-- RLS (see create_progress) still limits every call to the caller's own row;
-- anonymous visitors get no access at all.
grant select, insert, update on table public.progress to authenticated;
revoke all on table public.progress from anon;

-- A learner can only ever fill their own row, but cap it anyway so one account
-- can't store megabytes of junk. Real progress for the whole word list is ~10 KB.
alter table public.progress
  add constraint progress_data_size check (pg_column_size(data) <= 131072);
