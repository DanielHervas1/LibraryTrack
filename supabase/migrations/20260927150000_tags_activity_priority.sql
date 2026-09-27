-- Fase 3: tags libres, registro de actividad (rewatches ahora, diario en la Fase 4)
-- y prioridad de "Mi lista".

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  -- Clave para unicidad sin distinguir mayúsculas ("Nostalgia" = "nostalgia").
  name_key text generated always as (lower(btrim(name))) stored,
  created_at timestamptz not null default now(),
  constraint tags_unique_name unique (user_id, name_key)
);

create table public.entry_tags (
  entry_id uuid not null references public.entries (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, tag_id)
);

create index entry_tags_tag_idx on public.entry_tags (tag_id);
create index entry_tags_user_idx on public.entry_tags (user_id);

alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;

create policy "tags_select_own" on public.tags
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "tags_insert_own" on public.tags
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tags_update_own" on public.tags
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "tags_delete_own" on public.tags
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "entry_tags_select_own" on public.entry_tags
  for select to authenticated using ((select auth.uid()) = user_id);
-- Solo se pueden enlazar entradas y tags propios.
create policy "entry_tags_insert_own" on public.entry_tags
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid()))
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = (select auth.uid()))
  );
create policy "entry_tags_delete_own" on public.entry_tags
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Registro de actividad (rewatches ya; inicio/progreso/fin en la Fase 4)
-- ---------------------------------------------------------------------------

create type public.activity_kind as enum ('started', 'progress', 'finished', 'rewatched');

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  kind public.activity_kind not null,
  date date not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index activity_log_user_date_idx on public.activity_log (user_id, date desc);
create index activity_log_entry_idx on public.activity_log (entry_id, date desc);

alter table public.activity_log enable row level security;

create policy "activity_log_select_own" on public.activity_log
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "activity_log_insert_own" on public.activity_log
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid()))
  );
create policy "activity_log_update_own" on public.activity_log
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "activity_log_delete_own" on public.activity_log
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Entradas: prioridad de "Mi lista" (1 alta, 2 media, 3 baja) y búsqueda por género
-- ---------------------------------------------------------------------------

alter table public.entries
  add constraint entries_priority_range check (priority is null or priority between 1 and 3);

create index entries_genres_idx on public.entries using gin (genres);
