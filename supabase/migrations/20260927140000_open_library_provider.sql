-- Open Library como proveedor de libros sin API key (respaldo de Google Books).
alter type public.provider add value if not exists 'open_library';
