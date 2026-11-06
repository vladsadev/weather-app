import type { AppState } from "../types/AppState";
import { selectCity, type Cli } from "../presentation/input";
import { note, success, warning } from "../presentation/output";
import {
  getDefaultCity,
  removeCityFromState,
} from "../storage/citiesStorage";
import { persistState } from "./persistState";
import { formatCityLabel } from "../utils/format";
import { listCities } from "./listCities";

export async function removeCity(state: AppState, rl: Cli): Promise<void> {
  if (state.cities.length === 0) {
    warning("No hay ciudades guardadas para eliminar.");
    return;
  }

  listCities(state);

  const city = await selectCity(
    state,
    rl,
    "  Número de ciudad a eliminar (0 para cancelar): ",
  );

  if (!city) return;

  const next = { ...state, cities: [...state.cities] };
  const wasDefault = removeCityFromState(next, city);

  if (!(await persistState(state, next))) return;
  success(`Ciudad eliminada: ${formatCityLabel(city)}`);

  if (wasDefault) {
    const newDefault = getDefaultCity(state);

    if (newDefault) {
      note(`Nueva ciudad default: ${formatCityLabel(newDefault)}`);
    } else {
      warning("No queda ninguna ciudad default.");
    }
  }
}
