import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppState } from "../../src/types/AppState";
import { lapaz, savedState } from "../helpers/context";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
let home = "";

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), "weather-cli-e2e-"));
});

afterEach(async () => {
  await rm(home, { recursive: true, force: true });
});

async function session(state: AppState | null, steps: [string, string][]) {
  if (state) await Bun.write(join(home, "config.json"), JSON.stringify(state));
  const child = Bun.spawn([process.execPath, "src/index.ts", "--no-color"], {
    cwd: projectRoot,
    env: { ...process.env, WEATHER_CLI_HOME: home, NO_COLOR: "1" },
    stdin: "pipe", stdout: "pipe", stderr: "pipe",
  });
  const stderr = new Response(child.stderr).text();
  const reader = child.stdout.getReader();
  const decoder = new TextDecoder();
  let output = "";
  let position = 0;
  // Kill a stuck CLI even if a prompt is missing, then release its streams.
  const timer = setTimeout(() => child.kill(), 3000);

  async function read() {
    const chunk = await reader.read();
    if (chunk.done) return false;
    output += decoder.decode(chunk.value, { stream: true });
    return true;
  }

  try {
    for (const [prompt, answer] of steps) {
      while (output.indexOf(prompt, position) === -1) {
        if (!(await read())) throw new Error(`Falta el prompt ${prompt}:\n${output}\n${await stderr}`);
      }
      position = output.indexOf(prompt, position) + prompt.length;
      child.stdin.write(`${answer}\n`);
      await child.stdin.flush();
    }
    child.stdin.end();
    while (await read()) {}
    return { output, errors: await stderr, exitCode: await child.exited };
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null) child.kill();
    await child.exited;
    reader.releaseLock();
  }
}

describe("CLI como proceso real", () => {
  const menu = "Selecciona una opción: ";

  test("rechaza una opción inválida y sale con 9", async () => {
    const result = await session(savedState(), [[menu, "99"], [menu, "9"]]);
    expect(result.exitCode).toBe(0);
    expect(result.errors).toBe("");
    expect(result.output).toContain("Opción no válida");
    expect(result.output).toContain("¡Hasta luego!");
  });

  test("cambia ajustes y default, elimina una ciudad y conserva todo entre ejecuciones", async () => {
    const result = await session(savedState(), [
      [menu, "8"], [menu, "2"], [menu, "3"],
      [menu, "5"], ["Número de ciudad default (0 para cancelar): ", "2"],
      [menu, "4"], ["Número de ciudad a eliminar (0 para cancelar): ", "1"],
      [menu, "9"],
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.errors).toBe("");
    expect(result.output).toContain("Unidad establecida: °F");
    expect(result.output).toContain("Ciudad default: La Paz");
    expect(result.output).toContain("Ciudad eliminada: Ottawa");
    const state = await Bun.file(join(home, "config.json")).json();
    expect(state).toEqual({ cities: [lapaz], defaultCityId: lapaz.id, unit: "fahrenheit" });
    const reopened = await session(null, [[menu, "9"]]);
    expect(reopened.exitCode).toBe(0);
    expect(reopened.errors).toBe("");
    expect(reopened.output).toContain("Clima de todas las ciudades (1)");
    expect(reopened.output).toContain("Ajustes (°F)");
    expect(reopened.output).not.toContain("Bienvenido");
  });

  test("un inicio vacío permite cancelar y salir al cerrarse stdin", async () => {
    const result = await session(null, [["Nombre de la ciudad: ", ""], [menu, "8"]]);
    expect(result.exitCode).toBe(0);
    expect(result.errors).toBe("");
    expect(result.output).toContain("Bienvenido");
    expect(result.output).toContain("Ingresa un nombre de ciudad");
    expect(result.output).toContain("¡Hasta luego!");
    expect(await Bun.file(join(home, "config.json")).exists()).toBe(false);
  });

  test("cerrar stdin en el menú termina limpiamente", async () => {
    const result = await session(savedState(), [[menu, "99"]]);
    expect(result.exitCode).toBe(0);
    expect(result.errors).toBe("");
    expect(result.output).toContain("¡Hasta luego!");
  });

  test("reporta la versión sin iniciar el menú", async () => {
    const child = Bun.spawn([process.execPath, "src/index.ts", "--version"], {
      cwd: projectRoot,
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(child.stdout).text();
    const errors = await new Response(child.stderr).text();

    expect(await child.exited).toBe(0);
    expect(errors).toBe("");
    expect(output.trim()).toMatch(/^Weather CLI \S+$/);
  });
});
