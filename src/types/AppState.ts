import type { City } from "./City";

export type Unit = "celsius" | "fahrenheit";

export interface AppState {
  unit: Unit;
  defaultCityId: number | null;
  cities: City[];
}
