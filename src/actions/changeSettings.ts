import type { AppState, Unit } from "../types/AppState";
import { ask, type Cli } from "../presentation/input";
import { printSettingsMenu } from "../presentation/menu";
import { success, warning } from "../presentation/output";
import { persistState } from "./persistState";
import { unitSymbol } from "../utils/format";

export async function changeSettings(
  state: AppState,
  rl: Cli,
): Promise<void> {
  while (true) {
    printSettingsMenu(state);

    const option = await ask(rl, "  Selecciona una opción: ");
    if (option === null || option === "3") return;

    if (option !== "1" && option !== "2") {
      warning("Opción no válida. Intenta de nuevo.");
      continue;
    }

    const unit: Unit = option === "1" ? "celsius" : "fahrenheit";

    if (state.unit !== unit) {
      if (!(await persistState(state, { ...state, unit }))) continue;
    }

    success(`Unidad establecida: ${unitSymbol(unit)}`);
  }
}
