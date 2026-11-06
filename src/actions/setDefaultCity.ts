import type { AppState } from "../types/AppState";
import { selectCity, type Cli } from "../presentation/input";
import { success, warning } from "../presentation/output";
import { assignDefaultCity } from "../storage/citiesStorage";
import { persistState } from "./persistState";
import { formatCityLabel } from "../utils/format";
import { listCities } from "./listCities";

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

  const next = { ...state };
  assignDefaultCity(next, city);
  if (!(await persistState(state, next))) return;
  success(`Ciudad default: ${formatCityLabel(city)}`);
}
