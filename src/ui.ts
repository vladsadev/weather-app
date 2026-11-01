import { stdout } from "node:process";

const RESET = "\x1b[0m";
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

export type ColorCode = number | string;

function detectColor(): boolean {
  if (process.argv.includes("--no-color")) return false;
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== "0") {
    return true;
  }

  return stdout.isTTY === true;
}

export const colorEnabled = detectColor();

/**
 * Aplica estilos ANSI a un texto. Sin color (salida redirigida, `NO_COLOR`)
 * devuelve el texto intacto, así que las tablas siguen alineadas.
 */
export function paint(text: string, ...codes: ColorCode[]): string {
  if (!colorEnabled || codes.length === 0 || text === "") return text;
  return `\x1b[${codes.join(";")}m${text}${RESET}`;
}

export const red = (text: string): string => paint(text, 31);
export const green = (text: string): string => paint(text, 32);
export const yellow = (text: string): string => paint(text, 33);
export const blue = (text: string): string => paint(text, 34);
export const magenta = (text: string): string => paint(text, 35);
export const cyan = (text: string): string => paint(text, 36);
export const white = (text: string): string => paint(text, 37);
export const gray = (text: string): string => paint(text, 90);
export const dim = (text: string): string => paint(text, 2);
export const bold = (text: string): string => paint(text, 1);
export const boldCyan = (text: string): string => paint(text, 1, 36);
export const boldYellow = (text: string): string => paint(text, 1, 33);

const ZERO_WIDTH = new Set(["\u200B", "\u200D", "\uFE0E", "\uFE0F"]);
const EMOJI = /\p{Extended_Pictographic}/u;
const EMOJI_MODIFIER = /\p{Emoji_Modifier}/u;
const COMBINING = /\p{Mark}/u;

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

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Muestra un indicador de carga mientras corre la tarea y lo borra al terminar.
 * Sin terminal interactiva no imprime nada: el texto no se mezcla con la salida.
 */
export async function withSpinner<T>(
  message: string,
  task: () => Promise<T>,
): Promise<T> {
  if (stdout.isTTY !== true) return task();

  let frame = 0;

  const render = (): void => {
    const symbol = SPINNER_FRAMES[frame % SPINNER_FRAMES.length] ?? "·";
    frame += 1;
    stdout.write(`\r\x1b[2K  ${cyan(symbol)} ${dim(message)}`);
  };

  render();
  const timer = setInterval(render, 90);

  try {
    return await task();
  } finally {
    clearInterval(timer);
    stdout.write("\r\x1b[2K");
  }
}
