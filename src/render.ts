import type { City, Unit } from "./config";
import {
  formatCityLabel,
  formatTemperature,
  type CurrentWeather,
  type DailyForecast,
  type Forecast,
} from "./openMeteo";
import {
  boldCyan,
  cyan,
  dim,
  paint,
  padEnd,
  padStart,
  truncate,
  visualWidth,
  yellow,
} from "./ui";
import {
  describeWeather,
  type WeatherGroup,
  type WeatherInfo,
} from "./weatherCodes";

const DAY_WIDTH = 12;
const CONDITION_WIDTH = 23;
const RANGE_WIDTH = 11;
const BAR_WIDTH = 8;
const PRECIP_WIDTH = 6;
const WIND_WIDTH = 8;
const GAP = "  ";
const INDENT = "  ";

const GROUP_COLORS: Record<WeatherGroup, string> = {
  clear: "33",
  cloudy: "37",
  fog: "90",
  drizzle: "36",
  rain: "34",
  snow: "96",
  thunder: "35",
};

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("es", { weekday: "short" });
const MONTH_FORMAT = new Intl.DateTimeFormat("es", { month: "short" });

export function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

function toCelsius(value: number, unit: Unit): number {
  return unit === "fahrenheit" ? ((value - 32) * 5) / 9 : value;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function parseDate(date: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function formatDayLabel(date: string, index: number): string {
  const parsed = parseDate(date);
  if (!parsed) return date;

  const weekday = WEEKDAY_FORMAT.format(parsed).replace(/\.$/, "");
  const month = MONTH_FORMAT.format(parsed).replace(/\.$/, "");
  const day = parsed.getDate();

  if (index === 0) return `Hoy ${weekday} ${day}`;
  if (index === 1) return `Mañana ${weekday} ${day}`;

  return `${capitalize(weekday)} ${day} ${month}`;
}

function weatherIcon(info: WeatherInfo): string {
  return paint(info.icon, GROUP_COLORS[info.group]);
}

function barColor(maxCelsius: number): string {
  if (maxCelsius < 0) return "38;5;33";
  if (maxCelsius < 10) return "38;5;45";
  if (maxCelsius < 18) return "38;5;82";
  if (maxCelsius < 26) return "38;5;220";
  if (maxCelsius < 33) return "38;5;208";

  return "38;5;196";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Barra que ubica el rango mín–máx del día dentro del rango de la semana.
 * Los valores llegan ya convertidos a Celsius para comparar entre unidades.
 */
export function temperatureBar(
  minimum: number,
  maximum: number,
  weekMinimum: number,
  weekMaximum: number,
  width = BAR_WIDTH,
): string {
  const span = weekMaximum - weekMinimum || 1;
  const start = clamp(
    Math.round(((minimum - weekMinimum) / span) * (width - 1)),
    0,
    width - 1,
  );
  const end = clamp(
    Math.round(((maximum - weekMinimum) / span) * (width - 1)),
    start,
    width - 1,
  );
  const filled = end - start + 1;

  return [
    dim("░".repeat(start)),
    paint("█".repeat(filled), barColor(maximum)),
    dim("░".repeat(width - start - filled)),
  ].join("");
}

function currentSummary(current: CurrentWeather, prefix = ""): string {
  const info = describeWeather(current.weatherCode);

  return `${prefix}${yellow(
    formatTemperature(current.temperature, current.unit),
  )} ${dim("·")} ${weatherIcon(info)} ${info.description}`;
}

function currentDetails(current: CurrentWeather): string {
  const parts: string[] = [];

  if (current.apparentTemperature !== null) {
    parts.push(
      `${dim("sensación")} ${yellow(
        formatTemperature(current.apparentTemperature, current.unit),
      )}`,
    );
  }

  if (current.humidity !== null) {
    parts.push(`${dim("humedad")} ${Math.round(current.humidity)}%`);
  }

  if (current.windSpeed !== null) {
    parts.push(
      `${dim("viento")} ${Math.round(current.windSpeed)} ${current.windUnit}`,
    );
  }

  return parts.join(` ${dim("·")} `);
}

export function renderCurrent(city: City, current: CurrentWeather): string[] {
  const lines = [
    "",
    `${INDENT}${boldCyan(formatCityLabel(city))}`,
    `${INDENT}${currentSummary(current)}`,
  ];

  const details = currentDetails(current);
  if (details) lines.push(`${INDENT}${details}`);

  if (current.time) {
    lines.push(
      `${INDENT}${dim(`Actualizado: ${current.time.replace("T", " ")}`)}`,
    );
  }

  return lines;
}

function renderDayRow(
  day: DailyForecast,
  index: number,
  weekMinimum: number,
  weekMaximum: number,
  unit: Unit,
  windUnit: string,
): string {
  const info = describeWeather(day.weatherCode);
  const description = truncate(
    info.description,
    CONDITION_WIDTH - visualWidth(info.icon) - 1,
  );
  const condition = padEnd(
    `${weatherIcon(info)} ${description}`,
    CONDITION_WIDTH,
  );
  const minimum = padStart(`${Math.round(day.minimum)}°`, 4);
  const maximum = padStart(`${Math.round(day.maximum)}°`, 4);
  const range = padEnd(`${minimum} / ${maximum}`, RANGE_WIDTH);
  const bar = temperatureBar(
    toCelsius(day.minimum, unit),
    toCelsius(day.maximum, unit),
    toCelsius(weekMinimum, unit),
    toCelsius(weekMaximum, unit),
  );
  const precipitation =
    day.precipitationProbability === null
      ? "—"
      : `${Math.round(day.precipitationProbability)}%`;
  const precipitationCell =
    day.precipitationProbability === null ||
    day.precipitationProbability <= 0
      ? dim(padStart(precipitation, PRECIP_WIDTH))
      : paint(padStart(precipitation, PRECIP_WIDTH), "34");
  const wind =
    day.windSpeedMax === null
      ? "—"
      : `${Math.round(day.windSpeedMax)} ${windUnit}`;

  return [
    padEnd(formatDayLabel(day.date, index), DAY_WIDTH),
    condition,
    range,
    bar,
    precipitationCell,
    padStart(wind, WIND_WIDTH),
  ].join(GAP);
}

export function renderForecast(
  city: City,
  forecast: Forecast,
  unit: Unit,
): string[] {
  const { daily } = forecast;

  if (daily.length === 0) return [];

  const weekMinimum = Math.min(...daily.map((day) => day.minimum));
  const weekMaximum = Math.max(...daily.map((day) => day.maximum));
  const header = [
    padEnd("Día", DAY_WIDTH),
    padEnd("Condición", CONDITION_WIDTH),
    padEnd(`Mín/Máx ${unitSymbol(unit)}`, RANGE_WIDTH),
    padEnd("Rango", BAR_WIDTH),
    padStart("Lluvia", PRECIP_WIDTH),
    padStart("Viento", WIND_WIDTH),
  ].join(GAP);
  const rule = cyan("─".repeat(visualWidth(header)));

  const lines = [
    "",
    `${INDENT}${boldCyan(`PRONÓSTICO ${daily.length} DÍAS`)}`,
    `${INDENT}${dim(formatCityLabel(city))}`,
    `${INDENT}${currentSummary(forecast.current, `${dim("Ahora")} `)}`,
    `${INDENT}${rule}`,
    `${INDENT}${cyan(header)}`,
    `${INDENT}${rule}`,
    ...daily.map(
      (day, index) =>
        `${INDENT}${renderDayRow(
          day,
          index,
          weekMinimum,
          weekMaximum,
          unit,
          forecast.windUnit,
        )}`,
    ),
    `${INDENT}${rule}`,
  ];

  return lines;
}
