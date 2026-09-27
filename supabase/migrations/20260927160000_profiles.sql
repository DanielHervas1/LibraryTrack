-- Fase 4: preferencias del usuario (de momento, minutos por página para estimar horas
-- de lectura). La Fase 5 añade aquí los campos del perfil compartido.

create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  minutes_per_page numeric(4, 2) not null default 1.5 check (minutes_per_page between 0.2 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- El diario consulta por fechas de inicio y fin.
create index entries_user_started_idx on public.entries (user_id, started_at) where started_at is not null;
create index entries_user_finished_idx on public.entries (user_id, finished_at) where finished_at is not null;
