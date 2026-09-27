import type { MetadataRoute } from "next";

import { BRAND_ACCENT, THEME_BACKGROUNDS } from "@/lib/theme/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LibraryTrack",
    short_name: "LibraryTrack",
    description: "Registro personal de películas, series, anime y libros.",
    start_url: "/",
    display: "standalone",
    // El manifest no admite variables CSS ni temas: se usan las constantes de tema.
    background_color: THEME_BACKGROUNDS.light,
    theme_color: BRAND_ACCENT,
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
