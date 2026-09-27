-- Fase 5: perfil compartido de solo lectura (/share/<token>).
-- Quien tenga el enlace ve las entradas NO privadas, sin iniciar sesión y sin poder editar.
-- En vez de exponer la service-role key, dos funciones SECURITY DEFINER devuelven solo
-- los datos públicos cuando el token coincide.

alter table public.profiles
  add column display_name text check (display_name is null or char_length(display_name) <= 60),
  add column share_token text unique check (share_token is null or char_length(share_token) >= 32),
  add column share_hide_reviews boolean not null default false;

create function public.shared_profile(p_token text)
returns table (display_name text, hide_reviews boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.display_name, p.share_hide_reviews
  from public.profiles p
  where p.share_token = p_token
    and char_length(p_token) >= 32;
$$;

create function public.shared_entries(p_token text)
returns table (
  id uuid,
  title text,
  cover_url text,
  media_type public.media_type,
  status public.entry_status,
  score smallint,
  review text,
  genres text[],
  release_year smallint,
  is_favorite boolean,
  finished_at date,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id, e.title, e.cover_url, e.media_type, e.status, e.score,
    case when p.share_hide_reviews then null else e.review end,
    e.genres, e.release_year, e.is_favorite, e.finished_at, e.created_at
  from public.profiles p
  join public.entries e on e.user_id = p.user_id
  where p.share_token = p_token
    and char_length(p_token) >= 32
    and not e.is_private
  order by e.created_at desc;
$$;

-- Solo estas dos funciones son accesibles sin sesión; nada más cambia en RLS.
revoke all on function public.shared_profile(text) from public;
revoke all on function public.shared_entries(text) from public;
grant execute on function public.shared_profile(text) to anon, authenticated;
grant execute on function public.shared_entries(text) to anon, authenticated;
