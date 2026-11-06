import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDefaultState,
  getConfigPath,
  loadState,
  saveState,
} from "../../src/storage/settingsStorage";

const originalHome = process.env.WEATHER_CLI_HOME;
let home = "";

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  process.env.WEATHER_CLI_HOME = home;
});

afterEach(async () => {
  if (originalHome === undefined) {
    delete process.env.WEATHER_CLI_HOME;
  } else {
    process.env.WEATHER_CLI_HOME = originalHome;
  }

  await rm(home, { recursive: true, force: true });
});

async function writeConfig(value: unknown): Promise<void> {
  await mkdir(home, { recursive: true });
  await Bun.write(getConfigPath(), JSON.stringify(value));
}

describe("settingsStorage", () => {
  test("respeta WEATHER_CLI_HOME", () => {
    expect(getConfigPath()).toBe(join(home, "config.json"));
  });

  test("usa XDG_CONFIG_HOME cuando no hay WEATHER_CLI_HOME", () => {
    const originalXdg = process.env.XDG_CONFIG_HOME;
    delete process.env.WEATHER_CLI_HOME;
    process.env.XDG_CONFIG_HOME = home;
    try {
      expect(getConfigPath()).toBe(join(home, "weather-cli", "config.json"));
    } finally {
      process.env.WEATHER_CLI_HOME = home;
      if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
      else process.env.XDG_CONFIG_HOME = originalXdg;
    }
  });

  test("devuelve la configuración por defecto si no hay archivo", async () => {
    expect(await loadState()).toEqual(createDefaultState());
  });

  test("guarda y recupera el estado", async () => {
    const state = {
      unit: "fahrenheit" as const,
      defaultCityId: 42,
      cities: [
        {
          id: 42,
          name: "Ottawa",
          latitude: 45.42,
          longitude: -75.7,
          admin1: "Ontario",
          country: "Canadá",
        },
      ],
    };

    await saveState(state);

    expect(await loadState()).toEqual(state);
  });

  test("descarta ciudades inválidas y duplicadas", async () => {
    await writeConfig({
      unit: "kelvin",
      defaultCityId: 99,
      cities: [
        { id: 1, name: "Ottawa", latitude: 45.42, longitude: -75.7 },
        { id: 1, name: "Ottawa repetida", latitude: 45.42, longitude: -75.7 },
        { id: 2, name: "", latitude: 1, longitude: 2 },
        { id: 3, name: "Sin coordenadas" },
        "no es una ciudad",
      ],
    });

    const state = await loadState();

    expect(state.unit).toBe("celsius");
    expect(state.defaultCityId).toBeNull();
    expect(state.cities).toHaveLength(1);
    expect(state.cities[0]?.name).toBe("Ottawa");
  });

  test("usa la configuración por defecto si el JSON es inválido", async () => {
    await mkdir(home, { recursive: true });
    await Bun.write(getConfigPath(), "{ esto no es json");

    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      expect(await loadState()).toEqual(createDefaultState());
    } finally {
      console.warn = originalWarn;
    }
  });
});
