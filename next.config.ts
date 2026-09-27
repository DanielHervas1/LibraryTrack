import type { NextConfig } from "next";

// Portadas subidas a mano: se sirven desde el Storage público del proyecto de Supabase.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // App personal: nada debe aparecer en buscadores.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // El token del perfil compartido va en la URL: que no se envíe a otras webs.
        source: "/share/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Portadas de las APIs de metadatos.
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      { protocol: "https", hostname: "s4.anilist.co", pathname: "/file/anilistcdn/**" },
      { protocol: "https", hostname: "books.google.com", pathname: "/books/**" },
      { protocol: "https", hostname: "covers.openlibrary.org", pathname: "/b/**" },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/covers/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
