import type { AppState } from "../types/AppState";
import { printError } from "../presentation/output";
import { saveState } from "../storage/settingsStorage";

/** Actualiza el estado en memoria solo después de guardar los cambios. */
export async function persistState(state: AppState, next: AppState): Promise<boolean> {
  try {
    await saveState(next);
    Object.assign(state, next);
    return true;
  } catch (error) {
    printError("No se pudo guardar la configuración", error);
    return false;
  }
}
