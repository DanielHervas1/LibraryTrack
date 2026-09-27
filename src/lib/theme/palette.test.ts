// Comprueba el contraste WCAG AA de la paleta leyendo directamente globals.css, para que
// cualquier cambio de color futuro que rompa la legibilidad haga fallar los tests.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BRAND_ACCENT, THEME_BACKGROUNDS, THEME_TRANSITION_MS } from "./theme";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

/** Variables --nombre: valor de un bloque `selector { … }`. */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No se encuentra el bloque ${selector}`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );
}

const light = tokens(":root");
// El tema oscuro solo redefine lo que cambia; el resto se hereda de :root.
const dark = { ...light, ...tokens(':root[data-theme="dark"]') };

type Rgba = [number, number, number, number];

function parseColor(value: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)$/.exec(value);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4])];
  throw new Error(`Color no soportado en el test: ${value}`);
}

/** Color semitransparente sobre un fondo opaco. */
function over([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: Rgba = [255, 255, 255, 1];
const TEXT = 4.5; // WCAG 1.4.3 (texto normal)
const NON_TEXT = 3; // WCAG 1.4.11 (bordes de controles, iconos, marcas de gráficas)

describe.each([
  ["claro", light],
  ["oscuro", dark],
])("paleta %s", (_name, t) => {
  const c = (name: string) => parseColor(t[name]);

  it.each([
    ["foreground", "background"],
    ["foreground", "surface"],
    ["muted", "background"],
    ["muted", "surface"],
    ["accent", "background"],
    ["accent", "surface"],
    ["accent-foreground", "accent"],
    ["danger", "background"],
    ["danger", "surface"],
    ["success", "background"],
    ["success", "surface"],
    ["favorite", "background"],
    ["favorite", "surface"],
    ["background", "foreground"], // tooltips: texto de fondo sobre caja de texto principal
  ])("texto %s sobre %s ≥ 4,5:1", (fg, bg) => {
    expect(contrast(c(fg), c(bg))).toBeGreaterThanOrEqual(TEXT);
  });

  it.each([
    ["control-border", "background"],
    ["control-border", "surface"],
    ["chart", "background"],
    ["chart", "surface"],
    ["accent", "background"], // anillo de foco
  ])("%s sobre %s ≥ 3:1", (fg, bg) => {
    expect(contrast(c(fg), c(bg))).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it("los avisos con tinte al 10 % mantienen el texto legible", () => {
    const dangerTint = over([...c("danger").slice(0, 3), 0.1] as Rgba, c("background"));
    expect(contrast(c("danger"), dangerTint)).toBeGreaterThanOrEqual(TEXT);
    const accentTint = over([...c("accent").slice(0, 3), 0.1] as Rgba, c("surface"));
    expect(contrast(c("foreground"), accentTint)).toBeGreaterThanOrEqual(TEXT);
  });

  it("las insignias sobre portadas se leen incluso sobre una portada blanca (peor caso)", () => {
    const overlayOnWhite = over(c("overlay"), WHITE);
    expect(contrast(c("on-overlay"), overlayOnWhite)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(c("favorite-on-overlay"), overlayOnWhite)).toBeGreaterThanOrEqual(NON_TEXT);
  });
});

describe("coherencia con el código", () => {
  it("THEME_BACKGROUNDS (barra del navegador) coincide con --background de cada tema", () => {
    expect(THEME_BACKGROUNDS.light).toBe(light.background);
    expect(THEME_BACKGROUNDS.dark).toBe(dark.background);
  });

  it("la transición de tema dura lo mismo en CSS y en theme.ts (150-200 ms)", () => {
    expect(css).toContain(`transition-duration: ${THEME_TRANSITION_MS}ms`);
    expect(THEME_TRANSITION_MS).toBeGreaterThanOrEqual(150);
    expect(THEME_TRANSITION_MS).toBeLessThanOrEqual(200);
  });

  it("BRAND_ACCENT (manifest) coincide con el --accent del tema claro", () => {
    expect(BRAND_ACCENT).toBe(light.accent);
  });

  it("cada tema declara su color-scheme para los controles nativos", () => {
    expect(css).toMatch(/:root \{\s*color-scheme: light;/);
    expect(css).toMatch(/:root\[data-theme="dark"\] \{\s*color-scheme: dark;/);
  });
});
