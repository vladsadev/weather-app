import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import type { AppState } from "../types/AppState";
import type { City } from "../types/City";
import { warning } from "./output";

export type Cli = ReturnType<typeof createInterface>;

export function createCli(): Cli {
  return createInterface({ input: stdin, output: stdout });
}

export async function ask(rl: Cli, question: string): Promise<string | null> {
  const controller = new AbortController();
  const onClose = () => controller.abort();
  rl.once("close", onClose);

  try {
    return (await rl.question(question, { signal: controller.signal })).trim();
  } catch {
    return null;
  } finally {
    rl.off("close", onClose);
  }
}

export async function selectFromList<T>(
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

    warning("Opción no válida. Intenta de nuevo.");
  }
}

export async function selectCity(
  state: AppState,
  rl: Cli,
  prompt: string,
): Promise<City | null> {
  return selectFromList(state.cities, rl, prompt);
}
