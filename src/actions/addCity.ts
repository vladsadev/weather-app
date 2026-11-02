import type { AppState } from "../types/AppState";
import { searchCities } from "../api/geocoding";
import { ask, selectFromList, type Cli } from "../presentation/input";
import {
  printError,
  success,
  warning,
  withSpinner,
} from "../presentation/output";
import {
  appendCity,
  cityFromResult,
  findCity,
} from "../storage/citiesStorage";
import { saveState } from "../storage/settingsStorage";
import { cyan } from "../utils/colors";
import { formatCityLabel } from "../utils/format";

async function persist(state: AppState): Promise<void> {
  try {
    await saveState(state);
  } catch (error) {
    printError("No se pudo guardar la configuración", error);
  }
}

export async function addCity(state: AppState, rl: Cli): Promise<void> {
  const query = await ask(rl, "\n  Nombre de la ciudad: ");
  if (query === null) return;

  if (!query) {
    warning("Ingresa un nombre de ciudad.");
    return;
  }

  let results;

  try {
    results = await withSpinner("Buscando ciudades…", () => searchCities(query));
  } catch (error) {
    printError("No se pudo buscar la ciudad", error);
    return;
  }

  if (results.length === 0) {
    warning(`No se encontraron resultados para "${query}".`);
    return;
  }

  console.log(`\n  ${cyan("Resultados:")}`);
  results.forEach((result, index) => {
    console.log(`    ${cyan(`${index + 1})`)} ${formatCityLabel(result)}`);
  });

  const selected = await selectFromList(
    results,
    rl,
    "  Selecciona una ciudad (0 para cancelar): ",
  );

  if (!selected) return;

  const existing = findCity(state, selected.id);

  if (existing) {
    warning(`"${formatCityLabel(existing)}" ya está guardada.`);

    if (state.defaultCityId === null) {
      state.defaultCityId = existing.id;
      await persist(state);
      success("Establecida como ciudad default.");
    }

    return;
  }

  const city = cityFromResult(selected);
  const becameDefault = appendCity(state, city);

  await persist(state);
  success(`Ciudad agregada: ${formatCityLabel(city)}`);

  if (becameDefault) {
    success("Establecida como ciudad default.");
  }
}
