import { createCli, ask } from "./presentation/input";
import { printMenu } from "./presentation/menu";
import { note, success, warning } from "./presentation/output";
import { loadState } from "./storage/settingsStorage";
import { addCity } from "./actions/addCity";
import { changeSettings } from "./actions/changeSettings";
import { getForecast } from "./actions/getForecast";
import { getAllWeather, getDefaultWeather } from "./actions/getWeather";
import { removeCity } from "./actions/removeCity";
import { setDefaultCity } from "./actions/setDefaultCity";

export async function runCli(): Promise<void> {
  const state = await loadState();
  const rl = createCli();

  try {
    if (state.cities.length === 0) {
      note("Bienvenido a Weather CLI. Agrega tu primera ciudad para comenzar.");
      await addCity(state, rl);
    }

    while (true) {
      printMenu(state);

      const option = await ask(rl, "  Selecciona una opción: ");

      if (option === null || option === "9") {
        success("¡Hasta luego!");
        console.log("");
        return;
      }

      switch (option) {
        case "1":
          await getDefaultWeather(state);
          break;
        case "2":
          await getAllWeather(state);
          break;
        case "3":
          await addCity(state, rl);
          break;
        case "4":
          await removeCity(state, rl);
          break;
        case "5":
          await setDefaultCity(state, rl);
          break;
        case "6":
          await getForecast(state, rl, false);
          break;
        case "7":
          await getForecast(state, rl, true);
          break;
        case "8":
          await changeSettings(state, rl);
          break;
        default:
          warning("Opción no válida. Intenta de nuevo.");
      }
    }
  } finally {
    rl.close();
  }
}

if (import.meta.main) {
  runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n  Error inesperado: ${message}`);
    process.exitCode = 1;
  });
}
