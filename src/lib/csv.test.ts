import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("deja tal cual los valores simples", () => {
    expect(csvCell("Dune")).toBe("Dune");
    expect(csvCell(8)).toBe("8");
    expect(csvCell(true)).toBe("true");
  });

  it("vacío para null y undefined", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("entrecomilla comas, comillas y saltos de línea", () => {
    expect(csvCell("Hola, mundo")).toBe('"Hola, mundo"');
    expect(csvCell('Dijo "hola"')).toBe('"Dijo ""hola"""');
    expect(csvCell("línea 1\nlínea 2")).toBe('"línea 1\nlínea 2"');
  });

  it("neutraliza fórmulas en textos", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+34 600")).toBe("'+34 600");
    expect(csvCell("@user")).toBe("'@user");
  });

  it("no toca números negativos", () => {
    expect(csvCell(-3)).toBe("-3");
  });
});

describe("toCsv", () => {
  it("genera cabecera, filas, BOM y CRLF", () => {
    expect(toCsv(["a", "b"], [["1", "x,y"]])).toBe('﻿a,b\r\n1,"x,y"\r\n');
  });
});
