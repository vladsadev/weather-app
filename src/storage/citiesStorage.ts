import type { AppState } from "../types/AppState";
import type { City, GeocodingResult } from "../types/City";

export function findCity(state: AppState, id: number): City | undefined {
  return state.cities.find((city) => city.id === id);
}

export function getDefaultCity(state: AppState): City | undefined {
  return state.cities.find((city) => city.id === state.defaultCityId);
}

export function cityFromResult(result: GeocodingResult): City {
  return {
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    admin1: result.admin1,
    country: result.country,
  };
}

/**
 * Agrega una ciudad al estado y devuelve si pasó a ser la ciudad default.
 */
export function appendCity(state: AppState, city: City): boolean {
  state.cities.push(city);

  const becameDefault = state.defaultCityId === null;
  if (becameDefault) state.defaultCityId = city.id;

  return becameDefault;
}

/**
 * Elimina una ciudad y devuelve si era la ciudad default.
 */
export function removeCityFromState(state: AppState, city: City): boolean {
  const wasDefault = state.defaultCityId === city.id;
  state.cities = state.cities.filter((saved) => saved.id !== city.id);

  if (wasDefault) {
    state.defaultCityId = state.cities[0]?.id ?? null;
  }

  return wasDefault;
}

export function assignDefaultCity(state: AppState, city: City): void {
  state.defaultCityId = city.id;
}
