import { stdout } from "node:process";

const RESET = "\x1b[0m";

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
