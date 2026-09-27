# CLAUDE.md — Contexto del proyecto LibraryTrack

App personal para registrar lo que consumo: **películas, series, anime y libros**. Guarda puntuaciones, opiniones, progreso, un diario y estadísticas. La usa una sola persona (el dueño); como uso secundario, un amigo puede ver un perfil de solo lectura. No se va a monetizar ni escalar. El repo es **público** (licencia MIT).

- Nombre del repo: `LibraryTrack`. En el brief aparece como "Watch Diary" (nombre provisional, aún sin decidir).
- Hoja de ruta y estado actual: [PLAN.md](PLAN.md). **Antes de trabajar, mira en qué fase estamos** (casillas marcadas) y no adelantes trabajo de fases posteriores sin que se pida.
- Estado actual: **Fase 0 hecha (salvo el despliegue en Vercel) y Fase 1 (MVP de películas) implementada.** Las casillas de PLAN.md son la fuente de verdad.
- Supabase quedó confirmado como backend (27-09-2026). El resto de "Decisiones propuestas" se aplicó tal cual.

@AGENTS.md

### Next.js 16: diferencias que importan aquí

La versión instalada es más nueva que la que conoce el modelo. Ante la duda, consulta `node_modules/next/dist/docs/`.

- `middleware.ts` ahora es **`src/proxy.ts`** (función `proxy`, runtime Node).
- `cookies()`, `headers()`, `params` y `searchParams` son **solo async**. Tipa las páginas con los helpers globales `PageProps<"/ruta">`, `LayoutProps` y `RouteContext` (los genera `next typegen`).
- `next/image`: usa `preload` en lugar de `priority` (obsoleta).
- `error.tsx` recibe `retry()`, que vuelve a pedir los datos; `reset()` solo en casos concretos.
- `next lint` ya no existe: `npm run lint` llama a `eslint` directamente.
- Cada slot de ruta paralela (`@modal`) necesita su `default.tsx`, o el build falla.

---

## Decisiones tomadas (vienen del brief; no replantear)

- **Framework:** React + Next.js.
- **Formato final:** PWA instalable desde el navegador. No habrá app nativa ni publicación en tiendas por ahora.
- **APIs de metadatos:**
  - Películas y series → **TMDB** (con token; ya existe la cuenta)
  - Anime → **AniList** (GraphQL, sin key para lecturas públicas)
  - Libros → **Google Books** (funciona sin key; con key hay más cuota)
- Los metadatos se **autocompletan** desde la API, pero **todo es editable a mano**, sobre todo los géneros. También se puede crear una entrada 100% manual si no aparece en la API.
- **Estados:** Por ver · Viendo · En pausa · Completado · Abandonado.
- **Campos por entrada:** título, portada (de la API o subida a mano), tipo, géneros, puntuación, opinión, fechas (inicio y fin), progreso, tags libres y contador de rewatches.
- **Vistas:** catálogo en grid, detalle, calendario/diario, favoritos, Mi lista, selector aleatorio, estadísticas y perfil compartible de solo lectura (no indexable).
- **Exportación** de todos los datos en JSON y CSV.
- **Secretos** solo en variables de entorno (`.env.local`), nunca en el código. El `.gitignore` ya excluye `.env*` y permite `.env.example`.

## Decisiones propuestas (pendientes de confirmar en la Fase 0)

Si el usuario confirma o cambia alguna, actualiza esta sección y pásala a "Decisiones tomadas".

| Tema | Propuesta | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** en modo `strict` | Hay muchos datos de APIs externas con formas distintas; los tipos evitan errores |
| Router | **App Router** (`src/app/`) | Es el estándar actual; incluye Server Components, Server Actions y `manifest.ts` |
| Backend y BD | **Supabase** (Postgres + Auth + Storage) | Uso desde móvil y ordenador y perfil compartible → hace falta servidor. El plan gratuito sobra y trae auth y almacenamiento de portadas |
| Acceso a datos | Cliente `@supabase/ssr` + tipos generados con `supabase gen types` | Evita añadir un ORM; RLS protege los datos |
| Estilos | **Tailwind CSS** | Rápido para montar el grid y un diseño pensado primero para móvil |
| Validación | **Zod** | Para formularios, Server Actions y respuestas de las APIs |
| Hosting | **Vercel** | Despliegue sin configuración para Next.js |
| PWA | **Serwist** (`@serwist/next`) | `next-pwa` está sin mantenimiento |
| Tests | **Vitest** para la lógica (proveedores, estadísticas, exportación); E2E solo si hace falta | Enfocar los tests donde hay lógica de verdad |
| Gestor de paquetes | **npm** | Lo más simple |
| Modelo de tipos | **Una sola tabla `entries`** con columna `media_type` | Catálogo, estadísticas y exportación trabajan sobre todos los tipos a la vez; separarlos obligaría a hacer UNION en todas partes |
| Puntuación | **1-10 simple** al principio; por criterios más adelante (Fase 6) en una tabla aparte | El valor llega antes; un sistema no bloquea al otro |
| "Mi lista" | **Vista de las entradas con `status = 'planned'`**, no una entidad aparte | Evita tener dos fuentes de verdad para "pendiente" |
| Favoritos | Campo booleano `is_favorite` | Es independiente del estado |
| Idioma | **Interfaz en español**; código, BD e identificadores **en inglés** | Es la convención habitual y encaja con las APIs y las librerías |

---

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Zod · Serwist · Vitest · Vercel.

## Estructura de carpetas propuesta

```
src/
  app/
    (auth)/login/            # login (magic link / GitHub)
    (app)/                   # rutas protegidas (layout con navegación)
      page.tsx               # catálogo en grid (filtros por tipo, estado, tag…)
      entry/[id]/page.tsx    # detalle (página completa)
      @modal/(.)entry/[id]/  # detalle como modal sobre el grid (Fase 3)
      add/                   # buscar en la API / añadir a mano
      favorites/
      list/                  # "Mi lista" + selector aleatorio
      calendar/
      stats/
      settings/              # exportación, token de perfil compartido, preferencias
    share/[token]/           # perfil de solo lectura, sin login, noindex
    api/
      search/[provider]/route.ts   # proxy a TMDB / AniList / Google Books
      export/route.ts              # ?format=json|csv
    manifest.ts
  components/
    ui/                      # componentes genéricos (Button, Dialog, StarRating…)
    entries/                 # EntryCard, EntryGrid, EntryForm, ProgressControl…
    calendar/  stats/
  lib/
    providers/               # integración con APIs externas
      types.ts               # MediaProvider, MediaSearchResult, MediaDetails
      tmdb.ts  anilist.ts  google-books.ts
      index.ts               # registro: media_type → proveedor
    db/                      # clientes Supabase (server/browser), consultas
    actions/                 # Server Actions (crear/editar/borrar entradas…)
    stats/                   # cálculos puros de estadísticas (con tests)
    export/                  # serializadores JSON/CSV (con tests)
    validation/              # esquemas Zod
    constants.ts             # etiquetas de estados y tipos en español
  types/
    database.ts              # generado por `supabase gen types`, no editar a mano
supabase/
  migrations/                # SQL versionado; nunca cambiar el esquema a mano en el dashboard
public/
  icons/                     # iconos de la PWA
```

## Modelo de datos (borrador)

```
enum media_type:   movie | tv | anime | book
enum entry_status: planned | in_progress | paused | completed | dropped
enum provider:     tmdb | anilist | google_books | manual

entries
  id uuid pk, user_id uuid → auth.users
  media_type, status, provider, external_id text null   -- unique(user_id, provider, external_id)
  title, original_title, synopsis, cover_url, release_year
  genres text[]                  -- se copian de la API y son editables
  score smallint null (1-10)
  review text                    -- opinión personal
  started_at date, finished_at date
  is_favorite bool, is_private bool (se oculta en el perfil compartido)
  priority smallint null         -- para ordenar "Mi lista"
  rewatch_count int default 0
  -- progreso y duración (null si no aplica):
  runtime_minutes                -- películas
  current_season, current_episode, total_episodes, episode_minutes   -- series/anime
  current_page, total_pages      -- libros
  authors text[]                 -- libros
  metadata jsonb                 -- respuesta extra de la API que no tiene columna propia
  created_at, updated_at

tags (id, user_id, name unique por usuario)
entry_tags (entry_id, tag_id)

activity_log  (Fase 4)
  id, entry_id, date, kind: started | progress | finished | rewatched, detail jsonb

profiles
  user_id, display_name, share_token text unique null, share_hide_reviews bool
```

- **RLS activado en todas las tablas**: `user_id = auth.uid()`. El perfil compartido se lee desde el servidor validando `share_token` y filtrando `is_private = false`. Nunca se expone la service-role key al cliente.
- Los metadatos se **guardan como copia** al añadir la entrada: la app no depende de las APIs externas para mostrar el catálogo.

## Integración con APIs externas

- **Todas las llamadas pasan por el servidor** (Route Handlers o Server Actions). El cliente nunca llama directamente a TMDB ni a Google Books con credenciales.
- Cada proveedor implementa la interfaz común de `lib/providers/types.ts` y **normaliza** su respuesta. Los componentes nunca manejan la forma cruda de una API.
- TMDB: usar el **Read Access Token** (v4) en la cabecera `Authorization: Bearer`. Imágenes desde `https://image.tmdb.org/t/p/<size><path>`. Pedir `language=es-ES` con fallback a inglés si falta la sinopsis.
- AniList: `POST https://graphql.anilist.co`; límite de ~90 peticiones/minuto; preferir el título `romaji`/`english` según una preferencia del usuario.
- Google Books: las miniaturas llegan con `http://` → reescribir a `https://`. Añadir `key=` solo si existe `GOOGLE_BOOKS_API_KEY`.
- Cachear las búsquedas en el servidor (`fetch` con `next: { revalidate }`) y aplicar debounce en el cliente (~300 ms).
- Los dominios de imagen van en `next.config` → `images.remotePatterns` (TMDB, AniList, Google Books, Supabase Storage).

## Variables de entorno

Documentarlas siempre en `.env.example` (sin valores). Nunca usar el prefijo `NEXT_PUBLIC_` para un secreto.

```
TMDB_READ_ACCESS_TOKEN=          # secreto, solo servidor
GOOGLE_BOOKS_API_KEY=            # opcional, solo servidor
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # pública por diseño (protegida con RLS)
SUPABASE_SERVICE_ROLE_KEY=       # secreto, solo si hace falta en el servidor
ALLOWED_EMAIL=                   # única cuenta autorizada a iniciar sesión
```

## Convenciones de código

- TypeScript `strict`; nada de `any` sin un comentario que lo justifique.
- **Server Components por defecto**; `"use client"` solo cuando haga falta interactividad.
- Mutaciones con **Server Actions** en `lib/actions/`, validadas con Zod, que comprueban la sesión **siempre** (son endpoints públicos).
- Route Handlers solo para lo que necesita una URL: proxy de búsqueda y exportación.
- Archivos en `kebab-case.ts(x)`; componentes en `PascalCase`; exports con nombre (salvo `page`/`layout`, que Next exige como default).
- La lógica pura (estadísticas, exportación, normalización de APIs) va separada de la UI y tiene tests.
- Los textos de la UI en español, centralizados en `lib/constants.ts` cuando se repiten (etiquetas de estados y tipos). Las etiquetas dependen del tipo: "Viendo" → "Leyendo" en libros.
- Diseño **mobile-first**: la app se usará sobre todo en el móvil como PWA.
- Commits con el formato Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`), en español o inglés pero de forma coherente.
- Esquema de BD **solo por migraciones** en `supabase/migrations/`. Después de cada migración, regenerar `src/types/database.ts`.

## Comandos

```
npm run dev          # servidor de desarrollo (puerto 3000)
npm run build        # build de producción
npm run lint         # ESLint
npm run typecheck    # next typegen && tsc --noEmit
npm test             # Vitest (tests en src/**/*.test.ts)
npm run format       # Prettier (con plugin de Tailwind)
npm run db:push      # aplica supabase/migrations/ al proyecto enlazado
npm run db:types     # regenera src/types/database.ts desde el proyecto enlazado
```

Antes de dar una tarea por terminada, ejecuta `lint`, `typecheck`, `test` y `build`.

- La CLI de Supabase ya está enlazada con el proyecto remoto. **No hay Docker**, así que `supabase start` y `db dump` no funcionan: las migraciones se aplican directamente al proyecto remoto con `db:push`.
- Después de cada migración, ejecuta `npm run db:types`.
- El login es por magic link, así que no se puede probar una sesión con curl. Los flujos autenticados los prueba el usuario en el navegador.

## Cosas a tener en cuenta

- El repo es **público**: revisa que ningún commit incluya tokens, emails personales en el código ni datos exportados (`*.json`/`*.csv` de copias de seguridad).
- El perfil compartido es "compartible, no público": token aleatorio largo, revocable, con `noindex`.
- Las horas de lectura de libros son una **estimación** (páginas × minutos por página, configurable); indícalo así en la UI de estadísticas.
- El README describe solo películas, series y anime: hay que añadir los libros (tarea de la Fase 0).
