import type { AppState } from "../types/AppState";
import type { MenuOption } from "../types/MenuOption";
import { boldCyan, cyan, green } from "../utils/colors";
import { MENU_WIDTH } from "../utils/constants";
import { center, unitSymbol } from "../utils/format";

function menuItem({ key, label }: MenuOption): string {
  return `  ${cyan(`${key}.`)} ${label}`;
}

export function printMenu(state: AppState): void {
  const line = cyan("═".repeat(MENU_WIDTH));

  console.log(`\n${line}`);
  console.log(center(boldCyan("WEATHER CLI"), MENU_WIDTH));
  console.log(line);
  console.log(menuItem({ key: "1", label: "Clima de ciudad default" }));
  console.log(
    menuItem({
      key: "2",
      label: `Clima de todas las ciudades (${state.cities.length})`,
    }),
  );
  console.log(menuItem({ key: "3", label: "Buscar y agregar ciudad" }));
  console.log(menuItem({ key: "4", label: "Eliminar ciudad" }));
  console.log(menuItem({ key: "5", label: "Establecer ciudad default" }));
  console.log(menuItem({ key: "6", label: "Pronóstico 7 días" }));
  console.log(menuItem({ key: "7", label: "Pronóstico 7 días (otra ciudad)" }));
  console.log(menuItem({ key: "8", label: `Ajustes (${unitSymbol(state.unit)})` }));
  console.log(menuItem({ key: "9", label: "Salir" }));
  console.log(line);
}

export function printSettingsMenu(state: AppState): void {
  const line = cyan("─".repeat(MENU_WIDTH));

  console.log(`\n${line}`);
  console.log(`  ${boldCyan("Ajustes")}`);
  console.log(line);
  console.log(
    menuItem({
      key: "1",
      label: `Celsius (°C)${state.unit === "celsius" ? `  ${green("[actual]")}` : ""}`,
    }),
  );
  console.log(
    menuItem({
      key: "2",
      label: `Fahrenheit (°F)${state.unit === "fahrenheit" ? `  ${green("[actual]")}` : ""}`,
    }),
  );
  console.log(menuItem({ key: "3", label: "Volver" }));
  console.log(line);
}
