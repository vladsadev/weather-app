import type { AppState } from "../types/AppState";
import type { City } from "../types/City";
import { fetchForecast } from "../api/weather";
import { printLines, printError, renderForecast, warning, withSpinner } from "../presentation/output";
import { selectCity, type Cli } from "../presentation/input";
import { getDefaultCity } from "../storage/citiesStorage";
import { formatCityLabel } from "../utils/format";
import { listCities } from "./listCities";

async function printForecast(city: City, unit: AppState["unit"]): Promise<void> {
  try {
    const forecast = await withSpinner("Consultando el pronóstico…", () =>
      fetchForecast(city, unit),
    );

    printLines(renderForecast(city, forecast, unit));
  } catch (error) {
    printError(
      `No se pudo obtener el pronóstico de ${formatCityLabel(city)}`,
      error,
    );
  }
}

export async function getForecast(
  state: AppState,
  rl: Cli,
  chooseCity: boolean,
): Promise<void> {
  if (state.cities.length === 0) {
    warning("No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }

  let city = chooseCity ? undefined : getDefaultCity(state);

  if (!city) {
    listCities(state);
    city =
      (await selectCity(
        state,
        rl,
        "  Número de ciudad para el pronóstico (0 para cancelar): ",
      )) ?? undefined;

    if (!city) return;
  }

  await printForecast(city, state.unit);
}
