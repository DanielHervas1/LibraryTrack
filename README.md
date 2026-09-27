# LibraryTrack

Registro personal de **películas, series, anime y libros**: puntuaciones, opiniones, progreso y estadísticas de todo lo que veo y leo.

Construido con Next.js 16 (App Router), TypeScript, Tailwind CSS y Supabase. Los metadatos vienen de [TMDB](https://www.themoviedb.org/), [AniList](https://anilist.co/) y Google Books.

> Hoja de ruta en [PLAN.md](PLAN.md). Contexto técnico y convenciones en [CLAUDE.md](CLAUDE.md).

## Arrancar en local

Requisitos: Node.js 20.9 o superior y un proyecto de [Supabase](https://supabase.com/).

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` como `.env.local` y rellena los valores (URL y anon key de Supabase, token de TMDB y tu email en `ALLOWED_EMAIL`).

3. Enlaza tu proyecto de Supabase y aplica las migraciones:

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-de-tu-proyecto>
   npm run db:push
   ```

4. En Supabase → Authentication → URL Configuration, añade `http://localhost:3000/auth/confirm` a las Redirect URLs.

5. Arranca el servidor y entra en <http://localhost:3000>:

   ```bash
   npm run dev
   ```

## Scripts

| Comando             | Qué hace                                               |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Servidor de desarrollo                                 |
| `npm run build`     | Build de producción                                    |
| `npm run lint`      | ESLint                                                 |
| `npm run typecheck` | Genera los tipos de rutas y comprueba TypeScript       |
| `npm test`          | Tests unitarios (Vitest)                               |
| `npm run format`    | Formatea con Prettier                                  |
| `npm run db:push`   | Aplica las migraciones de `supabase/migrations/`       |
| `npm run db:types`  | Regenera `src/types/database.ts` desde el esquema real |

## Licencia

[MIT](LICENSE)

Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.
