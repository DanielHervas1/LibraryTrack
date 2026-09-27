# PLAN.md — Hoja de ruta de LibraryTrack

Hoja de ruta por fases. Cada fase deja la app **usable** y aporta valor por sí sola; no se empieza una fase sin cerrar la anterior (salvo tareas marcadas como independientes).

El contexto técnico, el modelo de datos y las convenciones están en [CLAUDE.md](CLAUDE.md). Este archivo solo dice **qué** se hace y **en qué orden**.

> **Nota sobre el orden:** el brief sugería "MVP con una categoría → estados y puntuación → …". Aquí estado y puntuación simple (1-10) entran ya en la Fase 1, porque un registro sin estado ni nota no aporta valor real. La puntuación por criterios sí queda para más adelante.

---

## Fase 0 — Cimientos

**Objetivo:** proyecto arrancando en local y desplegado, con base de datos y login funcionando. Sin funcionalidad de producto todavía.

- [x] Confirmar las decisiones marcadas como *propuestas* en CLAUDE.md (Supabase, TypeScript, Tailwind, idioma del código)
- [x] `create-next-app` con App Router, TypeScript, Tailwind, ESLint y carpeta `src/`
- [x] Añadir Prettier y los scripts `lint`, `typecheck` y `format`
- [x] Crear el proyecto de Supabase y la primera migración (`entries`, enums) en `supabase/migrations/`
- [x] Clientes de Supabase para servidor y navegador (`src/lib/db/`)
- [x] Auth: inicio de sesión con magic link o GitHub, limitado a mi email (allowlist)
- [x] Proxy (antes "middleware" en Next ≤15) que protege todas las rutas salvo `/login` y `/share/*`
- [x] `.env.example` con todas las variables (sin valores) y comprobado que `.env.local` no se sube al repo
- [ ] Desplegar en Vercel con las variables de entorno configuradas
- [x] Actualizar el README (añadir libros, cómo arrancar el proyecto en local)

**Hecho cuando:** puedo hacer login en la URL de producción y ver una página vacía protegida.

---

## Fase 1 — MVP: Películas

**Objetivo:** registrar películas de verdad y usar la app a diario. Empezamos por películas porque no tienen progreso y la key de TMDB ya existe.

- [x] Route Handler `GET /api/search/tmdb?type=movie&q=` que hace de proxy de TMDB (el token nunca llega al cliente)
- [x] Adaptador `lib/providers/tmdb.ts` que normaliza la respuesta a `MediaSearchResult`
- [x] Buscador con debounce → lista de resultados → "Añadir" crea la entrada con los metadatos (portada, título, sinopsis, géneros, año, duración)
- [x] Portada autocompletada desde TMDB; si el resultado es incorrecto o el usuario prefiere otra imagen, puede subir una portada manualmente (guardada en Supabase Storage) como alternativa
- [x] Evitar duplicados (`provider` + `external_id` único por usuario)
- [x] Catálogo en grid (portada + título), responsive y pensado primero para móvil
- [x] Vista detalle en su propia página `/entry/[id]` (el modal va en la Fase 3)
- [x] Editar: estado, puntuación 1-10, opinión, fecha de inicio y de fin, géneros (añadir y quitar)
- [x] Borrar una entrada (con confirmación)
- [x] Filtro por estado y orden (fecha de alta, puntuación, título)
- [x] `next/image` configurado con `remotePatterns` para `image.tmdb.org`

**Hecho cuando:** he registrado ~20 películas reales desde el móvil sin ninguna fricción grave.

---

## Fase 2 — Todos los tipos y progreso

**Objetivo:** cubrir las cuatro librerías (películas, series, anime y libros) y la entrada manual.

- [x] Series vía TMDB (`type=tv`): temporadas, episodios, duración por episodio
- [x] Anime vía AniList (GraphQL, sin key): episodios, duración, géneros
- [x] Libros vía Google Books: número de páginas, autores; forzar `https` en las miniaturas
- [x] Open Library como respaldo para libros cuando no hay `GOOGLE_BOOKS_API_KEY` (sin key, la cuota anónima de Google Books está agotada)
- [x] Interfaz común `MediaProvider` y registro de proveedores en `lib/providers/index.ts`
- [x] Selector de tipo en el buscador y pestañas o filtro por tipo en el catálogo
- [x] Progreso: temporada y episodio (series), episodio (anime), página (libros), con botones rápidos "+1 episodio" / "+N páginas"
- [x] Al completar el último episodio o página → proponer marcar como "Completado"
- [x] Etiquetas de estado según el tipo ("Viendo" / "Leyendo")
- [x] **Portada manual como alternativa en cualquier tipo**: si la API no devuelve imagen o el usuario quiere otra, puede subir una portada propia (Supabase Storage); esto aplica tanto a entradas con proveedor API como a las creadas a mano
- [x] **Entrada manual** cuando algo no está en la API: formulario completo con subida opcional de portada a Supabase Storage
- [x] Añadir los dominios de imagen de AniList, Google Books y Open Library a `remotePatterns`

**Hecho cuando:** puedo añadir cualquier cosa que consuma, esté en una API o no.

---

## Fase 3 — Organización y colección

**Objetivo:** convertir el registro en una colección cómoda de explorar.

- [ ] **Favoritos**: corazón en la tarjeta del grid y en el detalle + sección `/favorites`
- [ ] **Mi lista**: sección `/list` = entradas en estado "Por ver", con prioridad opcional (ver la decisión en CLAUDE.md)
- [ ] **Tags libres**: crear sobre la marcha, autocompletar los existentes, filtrar por tag
- [ ] **Contador de rewatches/relecturas** (botón "Volver a ver" que suma 1 y registra la fecha)
- [ ] **Selector aleatorio** "No sé qué ver": elige de Mi lista, con filtro opcional por tipo y duración máxima
- [ ] Búsqueda por texto dentro de mi catálogo + filtros combinados (tipo, estado, género, tag, favorito)
- [ ] Vista detalle como **modal** sobre el grid (intercepting routes), manteniendo `/entry/[id]` para enlaces directos
- [ ] **Exportación** JSON (completa, con todos los campos) y CSV (una fila por entrada) desde `/settings`
- [ ] (Opcional) Importar desde el JSON exportado → sirve de copia de seguridad restaurable

**Hecho cuando:** puedo responder rápido a "¿qué veo esta noche?" y tengo una copia de mis datos en local.

---

## Fase 4 — Diario, calendario y estadísticas

**Objetivo:** ver mi historial en el tiempo y sacar conclusiones.

- [ ] Tabla `activity_log` (empezar, avanzar, terminar, volver a ver), que se rellena automáticamente al cambiar el estado o el progreso
- [ ] Migración: generar el log histórico a partir de las `started_at` / `finished_at` que ya existen
- [ ] **Calendario** mensual con las portadas en miniatura por día + vista **timeline** en lista
- [ ] Al pulsar un día → lo que vi o leí ese día
- [ ] **Estadísticas** (`/stats`):
  - [ ] Horas totales por tipo (películas: duración; series y anime: episodios × duración; libros: páginas × minutos por página, configurable)
  - [ ] Número de entradas por tipo y por estado
  - [ ] Puntuación media (global y por tipo) y distribución de notas
  - [ ] Géneros y tags más frecuentes y mejor puntuados
  - [ ] Actividad por mes y por año
  - [ ] Filtro por año ("mi 2026")
- [ ] Cálculos de estadísticas en `lib/stats/` con tests unitarios

**Hecho cuando:** la página de estadísticas refleja bien mi último año de consumo.

---

## Fase 5 — PWA y perfil compartible

**Objetivo:** instalar la app en el móvil y poder enseñársela a un amigo.

- [ ] `app/manifest.ts` (nombre, iconos, `theme_color`, `display: standalone`)
- [ ] Service worker con **Serwist** (`@serwist/next`): cachear el app shell y las portadas
- [ ] Página offline de respaldo y lectura del catálogo en caché sin conexión
- [ ] Comprobar que se instala en Android (Chrome) y en iOS (Safari → "Añadir a pantalla de inicio")
- [ ] **Perfil de solo lectura** en `/share/[token]`: token aleatorio largo, regenerable y revocable desde `/settings`
- [ ] El perfil compartido no muestra las entradas marcadas como privadas ni las opiniones si así lo configuro
- [ ] `noindex` (meta robots + cabecera `X-Robots-Tag`) en todas las rutas `/share/*`
- [ ] Revisión de seguridad: RLS, que ninguna Server Action se pueda llamar sin sesión, que no haya secretos en el bundle del cliente

**Hecho cuando:** la app está instalada en mi móvil y un amigo abre mi enlace sin poder editar nada.

---

## Fase 6 — Ideas futuras (sin orden ni compromiso)

- Puntuación **por criterios** (tipo MyScreenScore): criterios configurables por tipo, con nota global calculada o manual
- Importar desde Letterboxd, MyAnimeList, Goodreads o TMDB (sus exportaciones en CSV/XML)
- Edición offline con sincronización diferida
- Modo oscuro/claro y tema personalizable
- "Resumen del año" estilo *Wrapped*
- Refrescar los metadatos desde la API (nuevas temporadas, portada actualizada)
- Enlaces a dónde ver cada título (TMDB `watch/providers`)
- Recordatorios de series en emisión

---

## Riesgos y cosas a vigilar

| Riesgo | Mitigación |
|---|---|
| Filtrar el token de TMDB al cliente | Todas las llamadas a APIs externas pasan por Route Handlers; nunca usar el prefijo `NEXT_PUBLIC_` para secretos |
| Cambios o caídas de las APIs externas | Guardar en la BD los metadatos al añadir la entrada; la app nunca depende de la API para mostrar mi catálogo |
| Pérdida de datos | La exportación (Fase 3) llega pronto; las copias automáticas de Supabase son un extra |
| Límites del plan gratuito de Supabase (el proyecto se pausa tras 7 días sin uso) | Uso diario previsto; si no, un cron ligero de keep-alive |
| Crecer demasiado el alcance | Cada fase tiene un "hecho cuando"; las ideas nuevas van a la Fase 6 |
