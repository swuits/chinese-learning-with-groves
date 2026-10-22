-- Supabase's default privileges hand every privilege on new tables to `authenticated`.
-- The app only ever reads, creates and updates a learner's own row, so keep exactly that.
revoke all on table public.progress from authenticated;
grant select, insert, update on table public.progress to authenticated;
