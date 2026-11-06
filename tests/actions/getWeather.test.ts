import { describe, expect, mock, test } from "bun:test";
import { getAllWeather, getDefaultWeather } from "../../src/actions/getWeather";
import { createDefaultState } from "../../src/storage/settingsStorage";
import { savedState, useTestContext } from "../helpers/context";
import { currentPayload } from "../helpers/weather";

describe("getWeather", () => {
  const ctx = useTestContext();

  test("sin ciudades no realiza peticiones HTTP", async () => {
    const fetch = ctx.mockJson(currentPayload);
    await getDefaultWeather(createDefaultState());
    await getAllWeather(createDefaultState());
    expect(fetch).not.toHaveBeenCalled();
    expect(ctx.output).toContain("No hay una ciudad default");
    expect(ctx.output).toContain("No hay ciudades guardadas");
  });

  test("muestra el clima de la default", async () => {
    const fetch = ctx.mockJson(currentPayload);
    await getDefaultWeather(savedState());
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(ctx.output).toContain("Ottawa");
    expect(ctx.output).toContain("12.3 °C");
    expect(ctx.errors).toBe("");
  });

  test("informa un fallo de la consulta sin propagarlo", async () => {
    await getDefaultWeather(savedState());
    expect(ctx.errors).toContain("No se pudo obtener el clima de Ottawa");
  });

  test("un fallo individual no oculta el clima de las demás ciudades", async () => {
    globalThis.fetch = mock(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.searchParams.get("latitude") === "45.42") throw new Error("sin red");
      return new Response(JSON.stringify(currentPayload));
    }) as unknown as typeof fetch;
    await getAllWeather(savedState());
    expect(ctx.output).toContain("Ottawa (default): no disponible");
    expect(ctx.output).toContain("La Paz: 12.3 °C");
  });
});
