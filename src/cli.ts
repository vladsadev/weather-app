import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import {
  loadState,
  saveState,
  type AppState,
  type City,
  type Unit,
} from "./config";
import {
  fetchCurrentWeather,
  fetchForecast,
  formatCityLabel,
  formatTemperature,
  searchCities,
  type GeocodingResult,
} from "./openMeteo";
import { renderCurrent, renderForecast, unitSymbol } from "./render";
import {
  boldCyan,
  center,
  cyan,
  dim,
  green,
  red,
  withSpinner,
  yellow,
} from "./ui";

type Cli = ReturnType<typeof createInterface>;

const MENU_WIDTH = 40;

function success(message: string): void {
  console.log(`  ${green("✓")} ${green(message)}`);
}

function note(message: string): void {
  console.log(`  ${cyan("•")} ${message}`);
}

function warning(message: string): void {
  console.log(`  ${yellow("!")} ${yellow(message)}`);
}

async function ask(rl: Cli, question: string): Promise<string | null> {
  try {
    return (await rl.question(question)).trim();
  } catch {
    return null;
  }
}

function printError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`\n  ${red("✖")} ${red(`${context}: ${message}`)}`);
}

async function persist(state: AppState): Promise<void> {
  try {
    await saveState(state);
  } catch (error) {
    printError("No se pudo guardar la configuración", error);
  }
}

function getDefaultCity(state: AppState): City | undefined {
  return state.cities.find((city) => city.id === state.defaultCityId);
}

function menuItem(key: string, label: string): string {
  return `  ${cyan(`${key}.`)} ${label}`;
}

function printMenu(state: AppState): void {
  const line = cyan("═".repeat(MENU_WIDTH));

  console.log(`\n${line}`);
  console.log(center(boldCyan("WEATHER CLI"), MENU_WIDTH));
  console.log(line);
  console.log(menuItem("1", "Clima de ciudad default"));
  console.log(
    menuItem("2", `Clima de todas las ciudades (${state.cities.length})`),
  );
  console.log(menuItem("3", "Buscar y agregar ciudad"));
  console.log(menuItem("4", "Eliminar ciudad"));
  console.log(menuItem("5", "Establecer ciudad default"));
  console.log(menuItem("6", "Pronóstico 7 días"));
  console.log(menuItem("7", "Pronóstico 7 días (otra ciudad)"));
  console.log(menuItem("8", `Ajustes (${unitSymbol(state.unit)})`));
  console.log(menuItem("9", "Salir"));
  console.log(line);
}

function printCityList(state: AppState, title: string): void {
  console.log(`\n  ${cyan(title)}`);

  state.cities.forEach((city, index) => {
    const marker =
      city.id === state.defaultCityId ? ` ${yellow("(default)")}` : "";

    console.log(
      `    ${cyan(`${index + 1})`)} ${formatCityLabel(city)}${marker}`,
    );
  });
}

async function selectFromList<T>(
  items: T[],
  rl: Cli,
  prompt: string,
): Promise<T | null> {
  while (true) {
    const answer = await ask(rl, prompt);
    if (answer === null || answer === "0" || answer === "") return null;

    const index = Number(answer);
    if (Number.isInteger(index) && index >= 1 && index <= items.length) {
      return items[index - 1] ?? null;
    }

    warning("Opción no válida. Intenta de nuevo.");
  }
}

async function selectCity(
  state: AppState,
  rl: Cli,
  prompt: string,
): Promise<City | null> {
  return selectFromList(state.cities, rl, prompt);
}

async function printWeather(city: City, unit: Unit): Promise<void> {
  try {
    const weather = await withSpinner("Consultando Open-Meteo…", () =>
      fetchCurrentWeather(city, unit),
    );

    renderCurrent(city, weather).forEach((line) => console.log(line));
  } catch (error) {
    printError(`No se pudo obtener el clima de ${formatCityLabel(city)}`, error);
  }
}

async function showDefaultWeather(state: AppState): Promise<void> {
  const city = getDefaultCity(state);

  if (!city) {
    warning("No hay una ciudad default. Usa la opción 5 para establecerla.");
    return;
  }

  await printWeather(city, state.unit);
}

async function showAllWeather(state: AppState): Promise<void> {
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

async function printForecast(city: City, unit: Unit): Promise<void> {
  try {
    const forecast = await withSpinner("Consultando el pronóstico…", () =>
      fetchForecast(city, unit),
    );

    renderForecast(city, forecast, unit).forEach((line) => console.log(line));
  } catch (error) {
    printError(
      `No se pudo obtener el pronóstico de ${formatCityLabel(city)}`,
      error,
    );
  }
}

async function showForecast(
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
    printCityList(state, "Ciudades guardadas:");
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

async function addCity(state: AppState, rl: Cli): Promise<void> {
  const query = await ask(rl, "\n  Nombre de la ciudad: ");
  if (query === null) return;

  if (!query) {
    warning("Ingresa un nombre de ciudad.");
    return;
  }

  let results: GeocodingResult[];

  try {
    results = await withSpinner("Buscando ciudades…", () =>
      searchCities(query),
    );
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

  const existing = state.cities.find((city) => city.id === selected.id);

  if (existing) {
    warning(`"${formatCityLabel(existing)}" ya está guardada.`);

    if (state.defaultCityId === null) {
      state.defaultCityId = existing.id;
      await persist(state);
      success("Establecida como ciudad default.");
    }

    return;
  }

  const city: City = {
    id: selected.id,
    name: selected.name,
    latitude: selected.latitude,
    longitude: selected.longitude,
    admin1: selected.admin1,
    country: selected.country,
  };

  state.cities.push(city);

  const becameDefault = state.defaultCityId === null;
  if (becameDefault) state.defaultCityId = city.id;

  await persist(state);
  success(`Ciudad agregada: ${formatCityLabel(city)}`);

  if (becameDefault) {
    success("Establecida como ciudad default.");
  }
}

async function deleteCity(state: AppState, rl: Cli): Promise<void> {
  if (state.cities.length === 0) {
    warning("No hay ciudades guardadas para eliminar.");
    return;
  }

  printCityList(state, "Ciudades guardadas:");

  const city = await selectCity(
    state,
    rl,
    "  Número de ciudad a eliminar (0 para cancelar): ",
  );

  if (!city) return;

  const wasDefault = state.defaultCityId === city.id;
  state.cities = state.cities.filter((saved) => saved.id !== city.id);

  if (wasDefault) {
    state.defaultCityId = state.cities[0]?.id ?? null;
  }

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

async function setDefaultCity(state: AppState, rl: Cli): Promise<void> {
  if (state.cities.length === 0) {
    warning("No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }

  printCityList(state, "Ciudades guardadas:");

  const city = await selectCity(
    state,
    rl,
    "  Número de ciudad default (0 para cancelar): ",
  );

  if (!city) return;

  state.defaultCityId = city.id;
  await persist(state);
  success(`Ciudad default: ${formatCityLabel(city)}`);
}

async function changeSettings(state: AppState, rl: Cli): Promise<void> {
  while (true) {
    const line = cyan("─".repeat(MENU_WIDTH));

    console.log(`\n${line}`);
    console.log(`  ${boldCyan("Ajustes")}`);
    console.log(line);
    console.log(
      menuItem(
        "1",
        `Celsius (°C)${state.unit === "celsius" ? `  ${green("[actual]")}` : ""}`,
      ),
    );
    console.log(
      menuItem(
        "2",
        `Fahrenheit (°F)${state.unit === "fahrenheit" ? `  ${green("[actual]")}` : ""}`,
      ),
    );
    console.log(menuItem("3", "Volver"));
    console.log(line);

    const option = await ask(rl, "  Selecciona una opción: ");
    if (option === null || option === "3") return;

    if (option !== "1" && option !== "2") {
      warning("Opción no válida. Intenta de nuevo.");
      continue;
    }

    const unit: Unit = option === "1" ? "celsius" : "fahrenheit";

    if (state.unit !== unit) {
      state.unit = unit;
      await persist(state);
    }

    success(`Unidad establecida: ${unitSymbol(unit)}`);
  }
}

export async function runCli(): Promise<void> {
  const state = await loadState();
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    if (state.cities.length === 0) {
      note("Bienvenido a Weather CLI. Agrega tu primera ciudad para comenzar.");
      await addCity(state, rl);
    }

    while (true) {
      printMenu(state);

      const option = await ask(rl, "  Selecciona una opción: ");

      if (option === null || option === "9") {
        success("¡Hasta luego!");
        console.log("");
        return;
      }

      switch (option) {
        case "1":
          await showDefaultWeather(state);
          break;
        case "2":
          await showAllWeather(state);
          break;
        case "3":
          await addCity(state, rl);
          break;
        case "4":
          await deleteCity(state, rl);
          break;
        case "5":
          await setDefaultCity(state, rl);
          break;
        case "6":
          await showForecast(state, rl, false);
          break;
        case "7":
          await showForecast(state, rl, true);
          break;
        case "8":
          await changeSettings(state, rl);
          break;
        default:
          warning("Opción no válida. Intenta de nuevo.");
      }
    }
  } finally {
    rl.close();
  }
}
