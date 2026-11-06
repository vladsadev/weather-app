import { describe, expect, test } from "bun:test";
import { appendCity, assignDefaultCity, cityFromResult, findCity, getDefaultCity, removeCityFromState } from "../../src/storage/citiesStorage";
import { createDefaultState } from "../../src/storage/settingsStorage";
import { lapaz, ottawa, savedState } from "../helpers/context";

describe("citiesStorage", () => {
  test("la primera ciudad se convierte en default", () => {
    const state = createDefaultState();
    expect(appendCity(state, ottawa)).toBe(true);
    expect(getDefaultCity(state)).toEqual(ottawa);
  });

  test("agregar otra ciudad conserva la default", () => {
    const state = savedState();
    expect(appendCity(state, { ...ottawa, id: 3 })).toBe(false);
    expect(state.defaultCityId).toBe(ottawa.id);
    expect(state.cities).toHaveLength(3);
  });

  test("eliminar la default elige la primera restante", () => {
    const state = savedState();
    expect(removeCityFromState(state, ottawa)).toBe(true);
    expect(state.cities).toEqual([lapaz]);
    expect(getDefaultCity(state)).toEqual(lapaz);
  });

  test("eliminar otra ciudad conserva la default", () => {
    const state = savedState();
    expect(removeCityFromState(state, lapaz)).toBe(false);
    expect(getDefaultCity(state)).toEqual(ottawa);
  });

  test("eliminar la última ciudad deja el estado vacío", () => {
    const state = { ...savedState(), cities: [ottawa] };
    removeCityFromState(state, ottawa);
    expect(state).toEqual(createDefaultState());
    expect(getDefaultCity(state)).toBeUndefined();
  });

  test("permite buscar y cambiar la default", () => {
    const state = savedState();
    expect(findCity(state, 99)).toBeUndefined();
    expect(findCity(state, lapaz.id)).toEqual(lapaz);
    assignDefaultCity(state, lapaz);
    expect(getDefaultCity(state)).toEqual(lapaz);
  });

  test("convierte un resultado geográfico sin compartir su objeto", () => {
    const result = { ...ottawa, country: "Canadá", admin1: "Ontario" };
    const city = cityFromResult(result);
    expect(city).toEqual(result);
    expect(city).not.toBe(result);
  });
});
