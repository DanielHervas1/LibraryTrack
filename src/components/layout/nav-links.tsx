"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; shortLabel?: string; icon: React.ReactNode };

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

/** Secciones principales: barra inferior en el móvil. */
const PRIMARY_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Catálogo",
    icon: icon("M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"),
  },
  {
    href: "/list",
    label: "Mi lista",
    icon: icon("M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"),
  },
  { href: "/add", label: "Añadir", icon: icon("M12 5v14M5 12h14") },
  {
    href: "/diary",
    label: "Diario",
    icon: icon("M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4zM4 10h16M9 2v4M15 2v4"),
  },
  {
    href: "/stats",
    label: "Estadísticas",
    shortLabel: "Stats",
    icon: icon("M4 20V10M10 20V4M16 20v-7M22 20H2"),
  },
];

/** Secundarias: iconos en la cabecera en el móvil. */
const SECONDARY_ITEMS: NavItem[] = [
  {
    href: "/favorites",
    label: "Favoritos",
    icon: icon(
      "M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.6 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.5 0 5.4 3.5 4.3 6.7-1.7 4.7-9.2 9.3-9.2 9.3z",
    ),
  },
  {
    href: "/settings",
    label: "Ajustes",
    icon: icon(
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    ),
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Enlaces del header (escritorio, desde md). */
export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-5 md:flex">
      {[...PRIMARY_ITEMS, ...SECONDARY_ITEMS].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="text-sm text-muted hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Iconos de Favoritos y Ajustes en la cabecera (móvil). */
export function MobileHeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secundaria" className="flex items-center gap-1 md:hidden">
      {SECONDARY_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          title={item.label}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface aria-[current=page]:text-accent"
        >
          {item.icon}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior fija (móvil / PWA). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted aria-[current=page]:text-accent"
            >
              {item.icon}
              {item.shortLabel ?? item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
