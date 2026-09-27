-- Esquema inicial: tipos de contenido, estados y tabla principal de entradas.
-- Tags, activity_log y profiles llegan en sus fases (ver PLAN.md).

create type public.media_type as enum ('movie', 'tv', 'anime', 'book');
create type public.entry_status as enum ('planned', 'in_progress', 'paused', 'completed', 'dropped');
create type public.provider as enum ('tmdb', 'anilist', 'google_books', 'manual');

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  media_type public.media_type not null,
  status public.entry_status not null default 'planned',
  provider public.provider not null default 'manual',
  external_id text,

  title text not null check (char_length(title) between 1 and 500),
  original_title text,
  synopsis text,
  cover_url text,
  release_year smallint check (release_year between 1800 and 2200),
  genres text[] not null default '{}',

  score smallint check (score between 1 and 10),
  review text,
  started_at date,
  finished_at date,

  is_favorite boolean not null default false,
  is_private boolean not null default false,
  priority smallint,
  rewatch_count integer not null default 0 check (rewatch_count >= 0),

  -- Duración y progreso (null si no aplica al tipo)
  runtime_minutes integer check (runtime_minutes > 0),
  current_season integer check (current_season >= 0),
  current_episode integer check (current_episode >= 0),
  total_episodes integer check (total_episodes >= 0),
  episode_minutes integer check (episode_minutes > 0),
  current_page integer check (current_page >= 0),
  total_pages integer check (total_pages >= 0),
  authors text[] not null default '{}',

  metadata jsonb not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entries_dates_ordered check (finished_at is null or started_at is null or finished_at >= started_at),
  constraint entries_manual_has_no_external_id check ((provider = 'manual') = (external_id is null)),
  constraint entries_unique_external unique (user_id, provider, external_id)
);

create index entries_user_created_idx on public.entries (user_id, created_at desc);
create index entries_user_status_idx on public.entries (user_id, status);
create index entries_user_type_idx on public.entries (user_id, media_type);

-- updated_at automático
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

-- RLS: cada usuario solo ve y modifica sus propias entradas
alter table public.entries enable row level security;

create policy "entries_select_own" on public.entries
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "entries_insert_own" on public.entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "entries_update_own" on public.entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "entries_delete_own" on public.entries
  for delete to authenticated using ((select auth.uid()) = user_id);
