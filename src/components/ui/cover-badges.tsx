// Insignias que van encima de una portada. Usan la capa --overlay (oscura en ambos temas)
// porque la portada puede ser de cualquier color: así el texto siempre se lee.

/** Nota (1-10) en la esquina superior derecha. */
export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="absolute top-2 right-2 rounded-md bg-overlay px-1.5 py-0.5 text-xs font-semibold text-on-overlay">
      {score}
    </span>
  );
}

/** Corazón de favorito, solo lectura (en el perfil compartido). */
export function FavoriteMark() {
  return (
    <span
      className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full bg-overlay text-sm text-favorite-on-overlay"
      title="Favorito"
      aria-label="Favorito"
    >
      ♥
    </span>
  );
}
