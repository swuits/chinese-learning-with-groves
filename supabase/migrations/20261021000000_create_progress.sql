-- One row per learner holding their vocab progress (xp, streak, per-word boxes).
create table public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "Learners can read their own progress"
  on public.progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners can create their own progress"
  on public.progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Learners can update their own progress"
  on public.progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
