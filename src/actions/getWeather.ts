import type { AppState, Unit } from "../types/AppState";
import type { City } from "../types/City";
import { fetchCurrentWeather } from "../api/weather";
import {
  printError,
  printLines,
  renderCurrent,
  warning,
  withSpinner,
} from "../presentation/output";
import { getDefaultCity } from "../storage/citiesStorage";
import { cyan, dim, red, yellow } from "../utils/colors";
import { formatCityLabel, formatTemperature } from "../utils/format";

async function showWeather(city: City, unit: Unit): Promise<void> {
  try {
    const weather = await withSpinner("Consultando Open-Meteo…", () =>
      fetchCurrentWeather(city, unit),
    );

    printLines(renderCurrent(city, weather));
  } catch (error) {
    printError(`No se pudo obtener el clima de ${formatCityLabel(city)}`, error);
  }
}

export async function getDefaultWeather(state: AppState): Promise<void> {
  const city = getDefaultCity(state);

  if (!city) {
    warning("No hay una ciudad default. Usa la opción 5 para establecerla.");
    return;
  }

  await showWeather(city, state.unit);
}

export async function getAllWeather(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    warning("No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }

  console.log(`\n  ${cyan("Clima de tus ciudades:")}`);

  const results = await withSpinner(
    `Consultando ${state.cities.length} ciudades…`,
    () =>
      Promise.allSettled(
        state.cities.map((city) => fetchCurrentWeather(city, state.unit)),
      ),
  );

  state.cities.forEach((city, index) => {
    const result = results[index];
    if (!result) return;

    const marker =
      city.id === state.defaultCityId ? ` ${yellow("(default)")}` : "";
    const label = `${cyan(`${index + 1}.`)} ${formatCityLabel(city)}${marker}`;

    if (result.status === "fulfilled") {
      console.log(
        `  ${label}: ${yellow(
          formatTemperature(result.value.temperature, result.value.unit),
        )}`,
      );
      return;
    }

    const message =
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
    console.log(`  ${label}: ${red("no disponible")} (${dim(message)})`);
  });
}
