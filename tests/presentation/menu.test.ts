import { describe, expect, test } from "bun:test";
import { printMenu, printSettingsMenu } from "../../src/presentation/menu";
import { savedState, useTestContext } from "../helpers/context";

describe("menu", () => {
  const ctx = useTestContext();

  test("conserva las nueve opciones del README con el contador y la unidad actuales", () => {
    printMenu(savedState());
    const options = ctx.output.split("\n").filter((line) => /^\s+\d\./.test(line));
    expect(options.map((line) => line.trim())).toEqual([
      "1. Clima de ciudad default",
      "2. Clima de todas las ciudades (2)",
      "3. Buscar y agregar ciudad",
      "4. Eliminar ciudad",
      "5. Establecer ciudad default",
      "6. Pronóstico 7 días",
      "7. Pronóstico 7 días (otra ciudad)",
      "8. Ajustes (°C)",
      "9. Salir",
    ]);
  });

  test("muestra Fahrenheit y marca únicamente la unidad seleccionada", () => {
    const state = { ...savedState(), unit: "fahrenheit" as const };
    printMenu(state);
    printSettingsMenu(state);
    expect(ctx.output).toContain("8. Ajustes (°F)");
    expect(ctx.output).toContain("2. Fahrenheit (°F)  [actual]");
    expect(ctx.output).not.toContain("Celsius (°C)  [actual]");
  });
});
