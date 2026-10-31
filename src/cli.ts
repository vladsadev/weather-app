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
  formatCityLabel,
  formatTemperature,
  searchCities,
  type GeocodingResult,
} from "./openMeteo";

type Cli = ReturnType<typeof createInterface>;

const MENU_WIDTH = 40;

function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
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
  console.error(`\n  ${context}: ${message}`);
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

function printMenu(state: AppState): void {
  const line = "═".repeat(MENU_WIDTH);

  console.log(`\n${line}`);
  console.log("         WEATHER CLI");
  console.log(line);
  console.log("  1. Clima de ciudad default");
  console.log(`  2. Clima de todas las ciudades (${state.cities.length})`);
  console.log("  3. Buscar y agregar ciudad");
  console.log("  4. Eliminar ciudad");
  console.log("  5. Establecer ciudad default");
  console.log(`  8. Ajustes (${unitSymbol(state.unit)})`);
  console.log("  9. Salir");
  console.log(line);
}

function printCityList(state: AppState, title: string): void {
  console.log(`\n  ${title}`);

  state.cities.forEach((city, index) => {
    const marker = city.id === state.defaultCityId ? " (default)" : "";
    console.log(`    ${index + 1}) ${formatCityLabel(city)}${marker}`);
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

    console.log("  Opción no válida. Intenta de nuevo.");
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
    const weather = await fetchCurrentWeather(city, unit);

    console.log(`\n  ${formatCityLabel(city)}`);
    console.log(
      `  Temperatura actual: ${formatTemperature(weather.temperature, weather.unit)}`,
    );

    if (weather.time) {
      console.log(`  Actualizado: ${weather.time.replace("T", " ")}`);
    }
  } catch (error) {
    printError(`No se pudo obtener el clima de ${formatCityLabel(city)}`, error);
  }
}

async function showDefaultWeather(state: AppState): Promise<void> {
  const city = getDefaultCity(state);

  if (!city) {
    console.log(
      "\n  No hay una ciudad default. Usa la opción 5 para establecerla.",
    );
    return;
  }

  await printWeather(city, state.unit);
}

async function showAllWeather(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    console.log(
      "\n  No hay ciudades guardadas. Usa la opción 3 para agregar una.",
    );
    return;
  }

  console.log("\n  Clima de tus ciudades:");

  const results = await Promise.allSettled(
    state.cities.map((city) => fetchCurrentWeather(city, state.unit)),
  );

  state.cities.forEach((city, index) => {
    const result = results[index];
    if (!result) return;

    const marker = city.id === state.defaultCityId ? " (default)" : "";
    const label = `${index + 1}. ${formatCityLabel(city)}${marker}`;

    if (result.status === "fulfilled") {
      console.log(
        `  ${label}: ${formatTemperature(result.value.temperature, result.value.unit)}`,
      );
      return;
    }

    const message =
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
    console.log(`  ${label}: no disponible (${message})`);
  });
}

async function addCity(state: AppState, rl: Cli): Promise<void> {
  const query = await ask(rl, "\n  Nombre de la ciudad: ");
  if (query === null) return;

  if (!query) {
    console.log("  Ingresa un nombre de ciudad.");
    return;
  }

  let results: GeocodingResult[];

  try {
    results = await searchCities(query);
  } catch (error) {
    printError("No se pudo buscar la ciudad", error);
    return;
  }

  if (results.length === 0) {
    console.log(`\n  No se encontraron resultados para "${query}".`);
    return;
  }

  console.log("\n  Resultados:");
  results.forEach((result, index) => {
    console.log(`    ${index + 1}) ${formatCityLabel(result)}`);
  });

  const selected = await selectFromList(
    results,
    rl,
    "  Selecciona una ciudad (0 para cancelar): ",
  );

  if (!selected) return;

  const existing = state.cities.find((city) => city.id === selected.id);

  if (existing) {
    console.log(`\n  "${formatCityLabel(existing)}" ya está guardada.`);

    if (state.defaultCityId === null) {
      state.defaultCityId = existing.id;
      await persist(state);
      console.log("  Establecida como ciudad default.");
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
  console.log(`\n  Ciudad agregada: ${formatCityLabel(city)}`);

  if (becameDefault) {
    console.log("  Establecida como ciudad default.");
  }
}

async function deleteCity(state: AppState, rl: Cli): Promise<void> {
  if (state.cities.length === 0) {
    console.log("\n  No hay ciudades guardadas para eliminar.");
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
  console.log(`\n  Ciudad eliminada: ${formatCityLabel(city)}`);

  if (wasDefault) {
    const newDefault = getDefaultCity(state);

    if (newDefault) {
      console.log(`  Nueva ciudad default: ${formatCityLabel(newDefault)}`);
    } else {
      console.log("  No queda ninguna ciudad default.");
    }
  }
}

async function setDefaultCity(state: AppState, rl: Cli): Promise<void> {
  if (state.cities.length === 0) {
    console.log(
      "\n  No hay ciudades guardadas. Usa la opción 3 para agregar una.",
    );
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
  console.log(`\n  Ciudad default: ${formatCityLabel(city)}`);
}

async function changeSettings(state: AppState, rl: Cli): Promise<void> {
  while (true) {
    const line = "─".repeat(MENU_WIDTH);

    console.log(`\n${line}`);
    console.log("  Ajustes");
    console.log(line);
    console.log(
      `  1. Celsius (°C)${state.unit === "celsius" ? "  [actual]" : ""}`,
    );
    console.log(
      `  2. Fahrenheit (°F)${state.unit === "fahrenheit" ? "  [actual]" : ""}`,
    );
    console.log("  3. Volver");
    console.log(line);

    const option = await ask(rl, "  Selecciona una opción: ");
    if (option === null || option === "3") return;

    if (option !== "1" && option !== "2") {
      console.log("\n  Opción no válida. Intenta de nuevo.");
      continue;
    }

    const unit: Unit = option === "1" ? "celsius" : "fahrenheit";

    if (state.unit !== unit) {
      state.unit = unit;
      await persist(state);
    }

    console.log(`\n  Unidad establecida: ${unitSymbol(unit)}`);
  }
}

export async function runCli(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const state = await loadState();

    if (state.cities.length === 0) {
      console.log(
        "\n  Bienvenido a Weather CLI. Agrega tu primera ciudad para comenzar.",
      );
      await addCity(state, rl);
    }

    while (true) {
      printMenu(state);

      const option = await ask(rl, "  Selecciona una opción: ");

      if (option === null || option === "9") {
        console.log("\n  ¡Hasta luego!\n");
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
        case "8":
          await changeSettings(state, rl);
          break;
        default:
          console.log("\n  Opción no válida. Intenta de nuevo.");
      }
    }
  } finally {
    rl.close();
  }
}
