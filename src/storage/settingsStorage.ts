import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { AppState, Unit } from "../types/AppState";
import type { City } from "../types/City";

export function createDefaultState(): AppState {
  return {
    unit: "celsius",
    defaultCityId: null,
    cities: [],
  };
}

export function getConfigPath(): string {
  const root =
    process.env.WEATHER_CLI_HOME ||
    join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "weather-cli");

  return join(root, "config.json");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCity(value: unknown): City | null {
  if (!isRecord(value)) return null;

  const { id, name, latitude, longitude, admin1, country } = value;

  if (
    typeof id !== "number" ||
    !Number.isFinite(id) ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    id,
    name: name.trim(),
    latitude,
    longitude,
    ...(typeof admin1 === "string" && admin1.trim() ? { admin1: admin1.trim() } : {}),
    ...(typeof country === "string" && country.trim() ? { country: country.trim() } : {}),
  };
}

function normalizeState(value: unknown): AppState {
  if (!isRecord(value)) return createDefaultState();

  const cities = Array.isArray(value.cities)
    ? value.cities
        .map(normalizeCity)
        .filter((city): city is City => city !== null)
    : [];

  const seen = new Set<number>();
  const uniqueCities = cities.filter((city) => {
    if (seen.has(city.id)) return false;
    seen.add(city.id);
    return true;
  });

  const unit: Unit = value.unit === "fahrenheit" ? "fahrenheit" : "celsius";
  const defaultCityId =
    typeof value.defaultCityId === "number" &&
    uniqueCities.some((city) => city.id === value.defaultCityId)
      ? value.defaultCityId
      : null;

  return {
    unit,
    defaultCityId,
    cities: uniqueCities,
  };
}

export async function loadState(): Promise<AppState> {
  const path = getConfigPath();
  const file = Bun.file(path);

  if (!(await file.exists())) return createDefaultState();

  try {
    return normalizeState(await file.json());
  } catch {
    console.warn(
      `  Aviso: no se pudo leer ${path}. Se usará una configuración nueva.`,
    );
    return createDefaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  const path = getConfigPath();
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${JSON.stringify(state, null, 2)}\n`);
}
