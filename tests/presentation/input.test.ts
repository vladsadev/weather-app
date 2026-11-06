import { describe, expect, test } from "bun:test";
import { ask, selectCity, selectFromList } from "../../src/presentation/input";
import { lapaz, savedState, scriptedCli, useTestContext } from "../helpers/context";

describe("input", () => {
  const ctx = useTestContext();

  test("recorta espacios de las respuestas", async () => {
    expect(await ask(scriptedCli("  Ottawa  "), "Ciudad: ")).toBe("Ottawa");
  });

  test("devuelve null al cerrarse la entrada", async () => {
    expect(await ask(scriptedCli(null), "Ciudad: ")).toBeNull();
  });

  test.each(["0", "", null])("permite cancelar la selección con %p", async (answer) => {
    expect(await selectFromList(["A"], scriptedCli(answer), "Ciudad: ")).toBeNull();
  });

  test("rechaza texto, decimales y números fuera de rango antes de seleccionar", async () => {
    const selected = await selectCity(savedState(), scriptedCli("abc", "1.5", "-1", "3", "2"), "Ciudad: ");
    expect(selected).toEqual(lapaz);
    expect(ctx.output.match(/Opción no válida/g)).toHaveLength(4);
  });
});
