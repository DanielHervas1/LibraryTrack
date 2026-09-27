import type { Metadata } from "next";

import { MediaSearch } from "@/components/search/media-search";
import { parseMediaType } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Añadir",
};

export default async function AddPage(props: PageProps<"/add">) {
  const searchParams = await props.searchParams;
  const type = parseMediaType(searchParams.type) ?? "movie";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Añadir</h1>
        <p className="mt-1 text-sm text-muted">
          Los datos se rellenan automáticamente; luego puedes editarlos.
        </p>
      </div>
      <MediaSearch initialType={type} />
    </div>
  );
}
