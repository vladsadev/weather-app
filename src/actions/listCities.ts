import type { AppState } from "../types/AppState";
import { printCityList } from "../presentation/output";

export function listCities(
  state: AppState,
  title = "Ciudades guardadas:",
): void {
  printCityList(state, title);
}
