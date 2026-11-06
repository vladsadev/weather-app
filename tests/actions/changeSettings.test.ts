import { describe, expect, test } from "bun:test";
import { changeSettings } from "../../src/actions/changeSettings";
import type { AppState } from "../../src/types/AppState";
import { loadState } from "../../src/storage/settingsStorage";
import { savedState, scriptedCli, useTestContext } from "../helpers/context";

describe("changeSettings", () => {
  const ctx = useTestContext();

  test("rechaza una opción inválida y guarda Fahrenheit", async () => {
    const state = savedState();
    await changeSettings(state, scriptedCli("99", "2", "3"));
    expect(state.unit).toBe("fahrenheit");
    expect(await loadState()).toEqual(state);
    expect(ctx.output).toContain("Opción no válida");
    expect(ctx.output).toContain("Unidad establecida: °F");
  });

  test("permite volver a Celsius", async () => {
    const state: AppState = { ...savedState(), unit: "fahrenheit" };
    await changeSettings(state, scriptedCli("1", "3"));
    expect(state.unit).toBe("celsius");
    expect(await loadState()).toEqual(state);
  });

  test.each(["3", null])("salir con %p conserva el estado", async (answer) => {
    const state = savedState();
    await changeSettings(state, scriptedCli(answer));
    expect(state).toEqual(savedState());
  });

  test("elegir la unidad actual no requiere escribir", async () => {
    const state = savedState();
    await ctx.blockSaving();
    await changeSettings(state, scriptedCli("1", "3"));
    expect(ctx.errors).toBe("");
    expect(ctx.output).toContain("Unidad establecida: °C");
  });

  test("si falla el guardado conserva la unidad anterior", async () => {
    const state = savedState();
    await ctx.blockSaving();
    await changeSettings(state, scriptedCli("2", "3"));
    expect(ctx.errors).toContain("No se pudo guardar la configuración");
    expect(ctx.output).not.toContain("Unidad establecida: °F");
    expect(state).toEqual(savedState());
  });
});
