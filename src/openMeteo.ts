import type { City, Unit } from "./config";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface CurrentWeather {
  temperature: number;
  unit: string;
  time: string;
}

interface GeocodingResponse {
  results?: unknown;
}

interface ForecastResponse {
  current?: {
    temperature_2m?: unknown;
    time?: unknown;
  };
  current_units?: {
    temperature_2m?: unknown;
  };
}

async function fetchJson<T>(url: URL): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error(
      "No se pudo conectar con Open-Meteo. Revisa tu conexión a internet.",
    );
  }

  if (!response.ok) {
    throw new Error(`Open-Meteo respondió con un error HTTP ${response.status}.`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Open-Meteo devolvió una respuesta inválida.");
  }
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  if (typeof value !== "object" || value === null) return false;

  const result = value as Record<string, unknown>;

  return (
    typeof result.id === "number" &&
    Number.isFinite(result.id) &&
    typeof result.name === "string" &&
    result.name.trim().length > 0 &&
    typeof result.latitude === "number" &&
    Number.isFinite(result.latitude) &&
    typeof result.longitude === "number" &&
    Number.isFinite(result.longitude)
  );
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  const data = await fetchJson<GeocodingResponse>(url);

  if (!Array.isArray(data.results)) return [];

  return data.results.filter(isGeocodingResult).map((result) => ({
    id: result.id,
    name: result.name.trim(),
    latitude: result.latitude,
    longitude: result.longitude,
    ...(typeof result.admin1 === "string" && result.admin1.trim()
      ? { admin1: result.admin1.trim() }
      : {}),
    ...(typeof result.country === "string" && result.country.trim()
      ? { country: result.country.trim() }
      : {}),
  }));
}

export async function fetchCurrentWeather(
  city: City,
  unit: Unit,
): Promise<CurrentWeather> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", "temperature_2m");
  url.searchParams.set("temperature_unit", unit);
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson<ForecastResponse>(url);
  const temperature = data.current?.temperature_2m;
  const reportedUnit = data.current_units?.temperature_2m;

  if (typeof temperature !== "number" || !Number.isFinite(temperature)) {
    throw new Error(`No se recibió una temperatura válida para ${city.name}.`);
  }

  return {
    temperature,
    unit:
      typeof reportedUnit === "string"
        ? reportedUnit
        : unit === "celsius"
          ? "°C"
          : "°F",
    time: typeof data.current?.time === "string" ? data.current.time : "",
  };
}

export function formatCityLabel(
  city: Pick<City, "name" | "admin1" | "country">,
): string {
  const parts = [city.name, city.admin1, city.country]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .map((part) => part.trim());

  return [...new Set(parts)].join(", ");
}

export function formatTemperature(value: number, unit: string): string {
  return `${value.toFixed(1)} ${unit}`;
}
