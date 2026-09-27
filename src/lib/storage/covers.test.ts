import { describe, expect, it } from "vitest";

import { coverPathFromUrl, isOwnCoverUrl, userCoverUrlPrefix } from "./covers";

const SUPABASE_URL = "https://abc.supabase.co";
const USER = "11111111-1111-4111-8111-111111111111";
const own = `${SUPABASE_URL}/storage/v1/object/public/covers/${USER}/entry/foto.webp`;

describe("userCoverUrlPrefix", () => {
  it("ignora la barra final de la URL de Supabase", () => {
    expect(userCoverUrlPrefix(`${SUPABASE_URL}/`, USER)).toBe(
      `${SUPABASE_URL}/storage/v1/object/public/covers/${USER}/`,
    );
  });
});

describe("coverPathFromUrl", () => {
  it("extrae la ruta dentro del bucket", () => {
    expect(coverPathFromUrl(own, SUPABASE_URL)).toBe(`${USER}/entry/foto.webp`);
    expect(coverPathFromUrl(`${own}?v=2`, SUPABASE_URL)).toBe(`${USER}/entry/foto.webp`);
  });

  it("devuelve null para URLs ajenas o vacías", () => {
    expect(coverPathFromUrl("https://image.tmdb.org/t/p/w500/x.jpg", SUPABASE_URL)).toBeNull();
    expect(coverPathFromUrl(null, SUPABASE_URL)).toBeNull();
  });

  it("rechaza rutas con ..", () => {
    expect(
      coverPathFromUrl(
        `${SUPABASE_URL}/storage/v1/object/public/covers/${USER}/../otro/x.jpg`,
        SUPABASE_URL,
      ),
    ).toBeNull();
  });
});

describe("isOwnCoverUrl", () => {
  it("solo acepta portadas de la carpeta del usuario", () => {
    expect(isOwnCoverUrl(own, SUPABASE_URL, USER)).toBe(true);
    expect(isOwnCoverUrl(own.replace(USER, "otro-usuario"), SUPABASE_URL, USER)).toBe(false);
    expect(isOwnCoverUrl("https://malicioso.com/x.jpg", SUPABASE_URL, USER)).toBe(false);
  });
});
