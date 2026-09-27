import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

import { RegisterServiceWorker } from "@/components/layout/register-service-worker";
import { ThemeSync } from "@/components/theme/theme-sync";
import { THEME_BACKGROUNDS, themeInitScript } from "@/lib/theme/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · LibraryTrack",
    default: "LibraryTrack",
  },
  description: "Registro personal de películas, series, anime y libros.",
  robots: { index: false, follow: false },
  // Next añade solo el <link rel="manifest"> a partir de app/manifest.ts.
  appleWebApp: {
    // iOS ignora el manifest al instalar: esto controla el nombre y la barra de estado.
    title: "LibraryTrack",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Valor inicial según el sistema; ThemeSync lo ajusta si el usuario fija un tema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_BACKGROUNDS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_BACKGROUNDS.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // El script de <head> pone data-theme antes de hidratar: suppressHydrationWarning
    // evita que React lo trate como error (solo afecta a los atributos de <html>).
    <html
      lang="es"
      data-theme="light"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica el tema guardado antes del primer pintado: sin parpadeo al cargar. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <ThemeSync />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
