import { describe, expect, it } from "vitest";

import { stripHtml, yearFromDate } from "./text";

describe("stripHtml", () => {
  it("quita etiquetas y convierte <br> en saltos de línea", () => {
    expect(stripHtml("Hola<br><br>mundo <i>cursiva</i>")).toBe("Hola\n\nmundo cursiva");
  });

  it("decodifica entidades comunes", () => {
    expect(stripHtml("Tom &amp; Jerry &quot;juntos&quot; &#039;ya&#039;")).toBe(
      "Tom & Jerry \"juntos\" 'ya'",
    );
  });

  it("devuelve null si no queda texto", () => {
    expect(stripHtml("<p> </p>")).toBeNull();
    expect(stripHtml(null)).toBeNull();
  });
});

describe("yearFromDate", () => {
  it("acepta fechas completas y años sueltos", () => {
    expect(yearFromDate("2021-09-15")).toBe(2021);
    expect(yearFromDate("2007")).toBe(2007);
  });

  it("devuelve null con valores inválidos", () => {
    expect(yearFromDate("")).toBeNull();
    expect(yearFromDate(undefined)).toBeNull();
    expect(yearFromDate("abcd")).toBeNull();
  });
});
