import type { Metadata } from "next";

import { MediaSearch } from "@/components/search/media-search";

export const metadata: Metadata = {
  title: "Añadir",
};

export default function AddPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Añadir película</h1>
        <p className="mt-1 text-sm text-muted">
          Los datos se rellenan desde TMDB; luego puedes editarlos.
        </p>
      </div>
      <MediaSearch />
    </div>
  );
}
