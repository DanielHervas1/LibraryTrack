"use client";

import { useOptimistic, useTransition } from "react";

import { setFavorite } from "@/lib/actions/collection";

type FavoriteButtonProps = {
  entryId: string;
  isFavorite: boolean;
  /** "overlay": sobre la portada del grid. "inline": en la ficha, con texto. */
  variant?: "overlay" | "inline";
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.5 0 5.4 3.5 4.3 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavoriteButton({ entryId, isFavorite, variant = "overlay" }: FavoriteButtonProps) {
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      await setFavorite(entryId, next);
    });
  }

  const label = optimistic ? "Quitar de favoritos" : "Añadir a favoritos";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimistic}
        className={`flex items-center gap-1.5 text-sm ${optimistic ? "text-favorite" : "text-muted hover:text-foreground"}`}
      >
        <HeartIcon filled={optimistic} />
        {optimistic ? "Favorito" : "Marcar favorito"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      className={`flex size-8 items-center justify-center rounded-full bg-overlay backdrop-blur transition ${
        optimistic ? "text-favorite-on-overlay" : "text-on-overlay/80 hover:text-on-overlay"
      }`}
    >
      <HeartIcon filled={optimistic} />
    </button>
  );
}
