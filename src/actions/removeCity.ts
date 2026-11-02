import type { AppState } from "../types/AppState";
import { selectCity, type Cli } from "../presentation/input";
import { note, printError, success, warning } from "../presentation/output";
import {
  getDefaultCity,
  removeCityFromState,
} from "../storage/citiesStorage";
import { saveState } from "../storage/settingsStorage";
import { formatCityLabel } from "../utils/format";
import { listCities } from "./listCities";

async function persist(state: AppState): Promise<void> {
  try {
    await saveState(state);
  } catch (error) {
    printError("No se pudo guardar la configuración", error);
  }
}

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

  const wasDefault = removeCityFromState(state, city);

  await persist(state);
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
