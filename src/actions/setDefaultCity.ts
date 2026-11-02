import type { AppState } from "../types/AppState";
import { selectCity, type Cli } from "../presentation/input";
import { printError, success, warning } from "../presentation/output";
import { assignDefaultCity } from "../storage/citiesStorage";
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

export async function setDefaultCity(
  state: AppState,
  rl: Cli,
): Promise<void> {
  if (state.cities.length === 0) {
    warning("No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }

  listCities(state);

  const city = await selectCity(
    state,
    rl,
    "  Número de ciudad default (0 para cancelar): ",
  );

  if (!city) return;

  assignDefaultCity(state, city);
  await persist(state);
  success(`Ciudad default: ${formatCityLabel(city)}`);
}
