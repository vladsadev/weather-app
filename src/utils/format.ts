import type { Unit } from "../types/AppState";
import type { City } from "../types/City";

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

const ZERO_WIDTH = new Set(["\u200B", "\u200D", "\uFE0E", "\uFE0F"]);
const EMOJI = /\p{Extended_Pictographic}/u;
const EMOJI_MODIFIER = /\p{Emoji_Modifier}/u;
const COMBINING = /\p{Mark}/u;

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("es", { weekday: "short" });
const MONTH_FORMAT = new Intl.DateTimeFormat("es", { month: "short" });

function charWidth(char: string): number {
  if (ZERO_WIDTH.has(char)) return 0;
  if (EMOJI_MODIFIER.test(char) || COMBINING.test(char)) return 0;
  if (EMOJI.test(char)) return 2;

  return 1;
}

/**
 * Ancho que ocupa el texto en la terminal: los emojis cuentan como dos
 * columnas y los códigos ANSI como cero.
 */
export function visualWidth(text: string): number {
  let width = 0;

  for (const char of text.replace(ANSI_PATTERN, "")) {
    width += charWidth(char);
  }

  return width;
}

export function padEnd(text: string, width: number): string {
  const padding = width - visualWidth(text);
  return padding > 0 ? `${text}${" ".repeat(padding)}` : text;
}

export function padStart(text: string, width: number): string {
  const padding = width - visualWidth(text);
  return padding > 0 ? `${" ".repeat(padding)}${text}` : text;
}

export function center(text: string, width: number): string {
  return padStart(text, Math.floor((width + visualWidth(text)) / 2));
}

export function truncate(text: string, width: number): string {
  if (visualWidth(text) <= width) return text;

  let result = "";
  let used = 0;

  for (const char of text) {
    const size = charWidth(char);
    if (used + size > width - 1) break;

    result += char;
    used += size;
  }

  return `${result}…`;
}

export function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
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
