import { describe, expect, test } from "bun:test";
import {
  formatDayLabel,
  padEnd,
  padStart,
  truncate,
  unitSymbol,
  visualWidth,
} from "./format";
import { paint } from "./colors";

describe("format", () => {
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

  test("etiqueta hoy y mañana", () => {
    expect(formatDayLabel("2026-10-31", 0)).toBe("Hoy sáb 31");
    expect(formatDayLabel("2026-11-01", 1)).toBe("Mañana dom 1");
  });

  test("usa día y mes para el resto de la semana", () => {
    expect(formatDayLabel("2026-11-02", 2)).toBe("Lun 2 nov");
    expect(formatDayLabel("2026-11-06", 6)).toBe("Vie 6 nov");
  });

  test("no falla con una fecha inválida", () => {
    expect(formatDayLabel("sin-fecha", 3)).toBe("sin-fecha");
  });

  test("usa el símbolo de la unidad elegida", () => {
    expect(unitSymbol("celsius")).toBe("°C");
    expect(unitSymbol("fahrenheit")).toBe("°F");
  });
});
