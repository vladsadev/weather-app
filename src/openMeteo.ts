import type { City, Unit } from "./config";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "weather_code",
  "wind_speed_10m",
].join(",");

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "wind_speed_10m_max",
].join(",");

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
  apparentTemperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  unit: string;
  windUnit: string;
  time: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number | null;
  minimum: number;
  maximum: number;
  precipitationProbability: number | null;
  windSpeedMax: number | null;
}

export interface Forecast {
  current: CurrentWeather;
  daily: DailyForecast[];
  temperatureUnit: string;
  windUnit: string;
  precipitationUnit: string;
}

interface GeocodingResponse {
  results?: unknown;
}

interface ForecastResponse {
  current?: Record<string, unknown>;
  current_units?: Record<string, unknown>;
  daily?: Record<string, unknown>;
  daily_units?: Record<string, unknown>;
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

function readNumber(
  source: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const value = source?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(
  source: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = source?.[key];

  return typeof value === "string" ? value : null;
}

function normalizeWindUnit(unit: string | null, fallback: string): string {
  if (unit === null) return fallback;
  return unit === "mp/h" ? "mph" : unit;
}

function readArray(
  source: Record<string, unknown> | undefined,
  key: string,
): unknown[] {
  const value = source?.[key];

  return Array.isArray(value) ? value : [];
}

function numberAt(values: unknown[], index: number): number | null {
  const value = values[index];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function createForecastUrl(city: City, unit: Unit): URL {
  const url = new URL(FORECAST_URL);
  const imperial = unit === "fahrenheit";

  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", CURRENT_FIELDS);
  url.searchParams.set("temperature_unit", unit);
  url.searchParams.set("wind_speed_unit", imperial ? "mph" : "kmh");
  url.searchParams.set("precipitation_unit", imperial ? "inch" : "mm");
  url.searchParams.set("timezone", "auto");

  return url;
}

function parseCurrent(
  data: ForecastResponse,
  city: City,
  unit: Unit,
): CurrentWeather {
  const temperature = readNumber(data.current, "temperature_2m");

  if (temperature === null) {
    throw new Error(`No se recibió una temperatura válida para ${city.name}.`);
  }

  return {
    temperature,
    apparentTemperature: readNumber(data.current, "apparent_temperature"),
    humidity: readNumber(data.current, "relative_humidity_2m"),
    weatherCode: readNumber(data.current, "weather_code"),
    windSpeed: readNumber(data.current, "wind_speed_10m"),
    unit:
      readString(data.current_units, "temperature_2m") ??
      (unit === "celsius" ? "°C" : "°F"),
    windUnit: normalizeWindUnit(
      readString(data.current_units, "wind_speed_10m"),
      "km/h",
    ),
    time: readString(data.current, "time") ?? "",
  };
}

function parseDaily(data: ForecastResponse): DailyForecast[] {
  const dates = readArray(data.daily, "time");
  const weatherCodes = readArray(data.daily, "weather_code");
  const maximums = readArray(data.daily, "temperature_2m_max");
  const minimums = readArray(data.daily, "temperature_2m_min");
  const precipitation = readArray(data.daily, "precipitation_probability_max");
  const winds = readArray(data.daily, "wind_speed_10m_max");

  const days: DailyForecast[] = [];

  dates.forEach((date, index) => {
    if (typeof date !== "string") return;

    const maximum = numberAt(maximums, index);
    const minimum = numberAt(minimums, index);

    if (maximum === null || minimum === null) return;

    days.push({
      date,
      weatherCode: numberAt(weatherCodes, index),
      minimum,
      maximum,
      precipitationProbability: numberAt(precipitation, index),
      windSpeedMax: numberAt(winds, index),
    });
  });

  return days;
}

export async function fetchCurrentWeather(
  city: City,
  unit: Unit,
): Promise<CurrentWeather> {
  const data = await fetchJson<ForecastResponse>(createForecastUrl(city, unit));

  return parseCurrent(data, city, unit);
}

export async function fetchForecast(
  city: City,
  unit: Unit,
  days = 7,
): Promise<Forecast> {
  const url = createForecastUrl(city, unit);
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("forecast_days", String(days));

  const data = await fetchJson<ForecastResponse>(url);
  const current = parseCurrent(data, city, unit);
  const daily = parseDaily(data);

  if (daily.length === 0) {
    throw new Error(`No se recibió un pronóstico válido para ${city.name}.`);
  }

  return {
    current,
    daily,
    temperatureUnit:
      readString(data.daily_units, "temperature_2m_max") ?? current.unit,
    windUnit: normalizeWindUnit(
      readString(data.daily_units, "wind_speed_10m_max"),
      current.windUnit,
    ),
    precipitationUnit:
      readString(data.daily_units, "precipitation_probability_max") ?? "%",
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
