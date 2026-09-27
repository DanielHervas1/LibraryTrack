import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

import { RegisterServiceWorker } from "@/components/layout/register-service-worker";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
