import type { AppState, Unit } from "../types/AppState";
import { ask, type Cli } from "../presentation/input";
import { printSettingsMenu } from "../presentation/menu";
import { printError, success, warning } from "../presentation/output";
import { saveState } from "../storage/settingsStorage";
import { unitSymbol } from "../utils/format";

async function persist(state: AppState): Promise<void> {
  try {
    await saveState(state);
  } catch (error) {
    printError("No se pudo guardar la configuración", error);
  }
}

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
      state.unit = unit;
      await persist(state);
    }

    success(`Unidad establecida: ${unitSymbol(unit)}`);
  }
}
