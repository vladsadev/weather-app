import type { GeocodingResult } from "../types/City";
import { GEOCODING_URL } from "../utils/constants";
import { fetchJson } from "./client";

interface GeocodingResponse {
  results?: unknown;
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
