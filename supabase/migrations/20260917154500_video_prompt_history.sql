create table if not exists public.video_prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt text not null,
  prompt_norm text not null,
  engine text not null default '',
  style text not null default '',
  shape text not null default '',
  template text not null default '',
  material text not null default '',
  palette text not null default '',
  camera text not null default '',
  uniqueness_key text not null,
  title text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists video_prompt_history_user_prompt_norm_idx
  on public.video_prompt_history (user_id, prompt_norm);

create unique index if not exists video_prompt_history_user_uniqueness_key_idx
  on public.video_prompt_history (user_id, uniqueness_key);

create index if not exists video_prompt_history_user_created_at_idx
  on public.video_prompt_history (user_id, created_at desc);

alter table public.video_prompt_history enable row level security;

drop policy if exists "video_prompt_history_select_own" on public.video_prompt_history;
create policy "video_prompt_history_select_own"
  on public.video_prompt_history
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "video_prompt_history_insert_own" on public.video_prompt_history;
create policy "video_prompt_history_insert_own"
  on public.video_prompt_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);
