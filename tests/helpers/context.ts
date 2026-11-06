import { afterEach, beforeEach, mock, spyOn } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EventEmitter } from "node:events";
import type { Cli } from "../../src/presentation/input";
import type { AppState } from "../../src/types/AppState";
import type { City } from "../../src/types/City";

export const ottawa: City = {
  id: 1, name: "Ottawa", latitude: 45.42, longitude: -75.7,
};
export const lapaz: City = {
  id: 2, name: "La Paz", latitude: -16.5, longitude: -68.15,
};

export function savedState(): AppState {
  return { unit: "celsius", defaultCityId: 1, cities: [{ ...ottawa }, { ...lapaz }] };
}

// Only the question boundary is simulated; actions, parsing and storage run normally.
export function scriptedCli(...answers: (string | null)[]): Cli {
  const question = mock(async () => {
    if (answers.length === 0) throw new Error("Entrada cerrada");
    const answer = answers.shift();
    if (answer === null) throw new Error("Entrada cerrada");
    return answer ?? "";
  });
  return Object.assign(new EventEmitter(), { question }) as unknown as Cli;
}

export function useTestContext() {
  const originalFetch = globalThis.fetch;
  const originalHome = process.env.WEATHER_CLI_HOME;
  let home = "";
  let logs: string[] = [];
  let errors: string[] = [];
  let restoreConsole = () => {};

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
    process.env.WEATHER_CLI_HOME = home;
    logs = [];
    errors = [];
    const log = spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.map(String).join(" "));
    });
    const error = spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args.map(String).join(" "));
    });
    restoreConsole = () => { log.mockRestore(); error.mockRestore(); };
    // A forgotten HTTP mock must fail locally instead of using the real network.
    globalThis.fetch = mock(async () => {
      throw new Error("Petición HTTP sin simular");
    }) as unknown as typeof fetch;
  });

  afterEach(async () => {
    restoreConsole();
    globalThis.fetch = originalFetch;
    if (originalHome === undefined) delete process.env.WEATHER_CLI_HOME;
    else process.env.WEATHER_CLI_HOME = originalHome;
    await rm(home, { recursive: true, force: true });
  });

  return {
    get home() { return home; },
    get output() { return logs.join("\n").replace(/\x1b\[[0-9;]*m/g, ""); },
    get errors() { return errors.join("\n").replace(/\x1b\[[0-9;]*m/g, ""); },
    mockJson(payload: unknown) {
      const fetch = mock(async () => new Response(JSON.stringify(payload)));
      globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
      return fetch;
    },
    async blockSaving() {
      const blocked = join(home, "blocked");
      await Bun.write(blocked, "This file cannot be a configuration directory.");
      process.env.WEATHER_CLI_HOME = blocked;
    },
  };
}
