import { describe, expect, test } from "bun:test";
import {
  padEnd,
  padStart,
  paint,
  truncate,
  visualWidth,
} from "./ui";

describe("ui", () => {
  test("mide texto plano", () => {
    expect(visualWidth("hola")).toBe(4);
  });

  test("ignora los códigos ANSI", () => {
    expect(visualWidth("\x1b[31mhola\x1b[0m")).toBe(4);
    expect(visualWidth(paint("hola", 31))).toBe(4);
  });

  test("cuenta emojis y selectores de variación", () => {
    expect(visualWidth("☀️")).toBe(2);
    expect(visualWidth("🌤️")).toBe(2);
    expect(visualWidth("⛅")).toBe(2);
    expect(visualWidth("🌨️")).toBe(2);
  });

  test("alinea columnas con emojis", () => {
    expect(visualWidth(padEnd("☀️ Sol", 8))).toBe(8);
    expect(visualWidth(padStart("8°", 4))).toBe(4);
  });

  test("recorta por ancho visual", () => {
    expect(truncate("Parcialmente nublado", 20)).toBe("Parcialmente nublado");
    expect(truncate("Parcialmente nublado", 10)).toBe("Parcialme…");
    expect(visualWidth(truncate("🌤️ Mayormente despejado", 10))).toBe(10);
  });
});
