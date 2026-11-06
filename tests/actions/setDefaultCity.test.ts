import { describe, expect, test } from "bun:test";
import { setDefaultCity } from "../../src/actions/setDefaultCity";
import { createDefaultState, loadState } from "../../src/storage/settingsStorage";
import { lapaz, savedState, scriptedCli, useTestContext } from "../helpers/context";

describe("setDefaultCity", () => {
  const ctx = useTestContext();

  test("cambia y persiste la default seleccionada", async () => {
    const state = savedState();
    await setDefaultCity(state, scriptedCli("2"));
    expect(state.defaultCityId).toBe(lapaz.id);
    expect(await loadState()).toEqual(state);
    expect(ctx.output).toContain("Ciudad default: La Paz");
  });

  test("cancelar no cambia la default", async () => {
    const state = savedState();
    await setDefaultCity(state, scriptedCli("0"));
    expect(state).toEqual(savedState());
    expect(ctx.output).not.toContain("✓");
  });

  test("informa que no hay ciudades", async () => {
    await setDefaultCity(createDefaultState(), scriptedCli());
    expect(ctx.output).toContain("No hay ciudades guardadas");
  });

  test("si falla el guardado conserva la default anterior", async () => {
    const state = savedState();
    await ctx.blockSaving();
    await setDefaultCity(state, scriptedCli("2"));
    expect(ctx.errors).toContain("No se pudo guardar la configuración");
    expect(ctx.output).not.toContain("Ciudad default: La Paz");
    expect(state).toEqual(savedState());
  });
});
