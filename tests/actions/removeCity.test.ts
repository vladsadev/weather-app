import { describe, expect, test } from "bun:test";
import { removeCity } from "../../src/actions/removeCity";
import { createDefaultState, loadState, saveState } from "../../src/storage/settingsStorage";
import { lapaz, ottawa, savedState, scriptedCli, useTestContext } from "../helpers/context";

describe("removeCity", () => {
  const ctx = useTestContext();

  test("elimina la default y persiste su reemplazo", async () => {
    const state = savedState();
    await removeCity(state, scriptedCli("1"));
    expect(state.cities).toEqual([lapaz]);
    expect(state.defaultCityId).toBe(lapaz.id);
    expect(await loadState()).toEqual(state);
    expect(ctx.output).toContain("Nueva ciudad default: La Paz");
  });

  test("elimina la última ciudad y persiste el estado vacío", async () => {
    const state = { ...savedState(), cities: [ottawa] };
    await removeCity(state, scriptedCli("1"));
    expect(state).toEqual(createDefaultState());
    expect(await loadState()).toEqual(state);
    expect(ctx.output).toContain("No queda ninguna ciudad default");
  });

  test("cancelar conserva estado y archivo", async () => {
    const state = savedState();
    await saveState(state);
    await removeCity(state, scriptedCli("0"));
    expect(state).toEqual(savedState());
    expect(await loadState()).toEqual(savedState());
  });

  test("informa que no hay ciudades", async () => {
    await removeCity(createDefaultState(), scriptedCli());
    expect(ctx.output).toContain("No hay ciudades guardadas para eliminar");
  });

  test("si falla el guardado conserva las ciudades y la default", async () => {
    const state = savedState();
    await ctx.blockSaving();
    await removeCity(state, scriptedCli("1"));
    expect(ctx.errors).toContain("No se pudo guardar la configuración");
    expect(ctx.output).not.toContain("Ciudad eliminada");
    expect(ctx.output).not.toContain("Nueva ciudad default");
    expect(state).toEqual(savedState());
  });
});
