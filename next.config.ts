import type { NextConfig } from "next";

// Portadas subidas a mano: se sirven desde el Storage público del proyecto de Supabase.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
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
