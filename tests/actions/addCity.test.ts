import { describe, expect, test } from "bun:test";
import { addCity } from "../../src/actions/addCity";
import type { AppState } from "../../src/types/AppState";
import { createDefaultState, loadState, saveState } from "../../src/storage/settingsStorage";
import { ottawa, savedState, scriptedCli, useTestContext } from "../helpers/context";

describe("addCity", () => {
  const ctx = useTestContext();

  test("busca, reintenta una selección inválida y guarda la primera ciudad como default", async () => {
    const fetch = ctx.mockJson({ results: [ottawa] });
    const state = createDefaultState();
    await addCity(state, scriptedCli(" Ottawa ", "99", "1"));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(state.cities).toEqual([ottawa]);
    expect(state.defaultCityId).toBe(ottawa.id);
    expect(await loadState()).toEqual(state);
    expect(ctx.output).toContain("Opción no válida");
    expect(ctx.output).toContain("Ciudad agregada");
  });

  test.each([null, "", "   "])("no consulta ni modifica el estado con entrada %p", async (answer) => {
    const fetch = ctx.mockJson({ results: [ottawa] });
    const state = createDefaultState();
    await addCity(state, scriptedCli(answer));
    expect(fetch).not.toHaveBeenCalled();
    expect(state).toEqual(createDefaultState());
  });

  test("cancelar la selección conserva el archivo existente", async () => {
    const state = savedState();
    await saveState(state);
    ctx.mockJson({ results: [{ ...ottawa, id: 3 }] });
    await addCity(state, scriptedCli("Ottawa", "0"));
    expect(state).toEqual(savedState());
    expect(await loadState()).toEqual(savedState());
  });

  test("rechaza una ciudad ya guardada", async () => {
    const state = savedState();
    ctx.mockJson({ results: [ottawa] });
    await addCity(state, scriptedCli("Ottawa", "1"));
    expect(state).toEqual(savedState());
    expect(ctx.output).toContain("ya está guardada");
    expect(ctx.output).not.toContain("Ciudad agregada");
  });

  test("una ciudad existente puede recuperar la default ausente", async () => {
    const state: AppState = { ...savedState(), defaultCityId: null };
    ctx.mockJson({ results: [ottawa] });
    await addCity(state, scriptedCli("Ottawa", "1"));
    expect(state.defaultCityId).toBe(ottawa.id);
    expect(await loadState()).toEqual(state);
  });

  test("informa una búsqueda sin resultados", async () => {
    ctx.mockJson({});
    const state = createDefaultState();
    await addCity(state, scriptedCli("Atlantis"));
    expect(state).toEqual(createDefaultState());
    expect(ctx.output).toContain("No se encontraron resultados");
  });

  test("informa un fallo de conexión sin agregar una ciudad", async () => {
    const state = createDefaultState();
    await addCity(state, scriptedCli("Ottawa"));
    expect(state).toEqual(createDefaultState());
    expect(ctx.errors).toContain("No se pudo buscar la ciudad");
  });

  test("un fallo al guardar no confirma ni agrega la ciudad", async () => {
    const state = createDefaultState();
    ctx.mockJson({ results: [ottawa] });
    await ctx.blockSaving();
    await addCity(state, scriptedCli("Ottawa", "1"));
    expect(ctx.errors).toContain("No se pudo guardar la configuración");
    expect(ctx.output).not.toContain("Ciudad agregada");
    expect(ctx.output).not.toContain("Establecida como ciudad default");
    expect(state).toEqual(createDefaultState());
  });

  test("un fallo al recuperar la default conserva el estado", async () => {
    const state: AppState = { ...savedState(), defaultCityId: null };
    ctx.mockJson({ results: [ottawa] });
    await ctx.blockSaving();
    await addCity(state, scriptedCli("Ottawa", "1"));
    expect(state.defaultCityId).toBeNull();
    expect(ctx.errors).toContain("No se pudo guardar la configuración");
    expect(ctx.output).not.toContain("Establecida como ciudad default");
  });
});
