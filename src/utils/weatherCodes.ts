export type WeatherGroup =
  | "clear"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

export interface WeatherInfo {
  description: string;
  icon: string;
  group: WeatherGroup;
}

function entry(
  description: string,
  icon: string,
  group: WeatherGroup,
): WeatherInfo {
  return { description, icon, group };
}

const UNKNOWN: WeatherInfo = {
  description: "Sin datos",
  icon: "❔",
  group: "cloudy",
};

// Códigos WMO que devuelve Open-Meteo.
const WEATHER_CODES = new Map<number, WeatherInfo>([
  [0, entry("Despejado", "☀️", "clear")],
  [1, entry("Mayormente despejado", "🌤️", "clear")],
  [2, entry("Parcialmente nublado", "⛅", "cloudy")],
  [3, entry("Nublado", "☁️", "cloudy")],
  [45, entry("Niebla", "🌫️", "fog")],
  [48, entry("Niebla helada", "🌫️", "fog")],
  [51, entry("Llovizna ligera", "🌦️", "drizzle")],
  [53, entry("Llovizna moderada", "🌦️", "drizzle")],
  [55, entry("Llovizna densa", "🌦️", "drizzle")],
  [56, entry("Llovizna helada", "🌧️", "drizzle")],
  [57, entry("Llovizna helada", "🌧️", "drizzle")],
  [61, entry("Lluvia ligera", "🌧️", "rain")],
  [63, entry("Lluvia moderada", "🌧️", "rain")],
  [65, entry("Lluvia fuerte", "🌧️", "rain")],
  [66, entry("Lluvia helada", "🌧️", "rain")],
  [67, entry("Lluvia helada", "🌧️", "rain")],
  [71, entry("Nieve ligera", "🌨️", "snow")],
  [73, entry("Nieve moderada", "🌨️", "snow")],
  [75, entry("Nieve fuerte", "🌨️", "snow")],
  [77, entry("Granos de nieve", "🌨️", "snow")],
  [80, entry("Chubascos ligeros", "🌦️", "rain")],
  [81, entry("Chubascos moderados", "🌦️", "rain")],
  [82, entry("Chubascos fuertes", "🌧️", "rain")],
  [85, entry("Chubascos de nieve", "🌨️", "snow")],
  [86, entry("Chubascos de nieve", "🌨️", "snow")],
  [95, entry("Tormenta", "⛈️", "thunder")],
  [96, entry("Tormenta con granizo", "⛈️", "thunder")],
  [99, entry("Tormenta con granizo", "⛈️", "thunder")],
]);

export function describeWeather(code: number | null | undefined): WeatherInfo {
  if (typeof code !== "number" || !Number.isFinite(code)) return UNKNOWN;

  return WEATHER_CODES.get(code) ?? UNKNOWN;
}
