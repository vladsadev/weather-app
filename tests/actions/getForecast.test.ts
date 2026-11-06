import { describe, expect, mock, test } from "bun:test";
import { getForecast } from "../../src/actions/getForecast";
import { createDefaultState } from "../../src/storage/settingsStorage";
import { savedState, scriptedCli, useTestContext } from "../helpers/context";
import { forecastPayload } from "../helpers/weather";

describe("getForecast", () => {
  const ctx = useTestContext();

  test("sin ciudades no consulta la API", async () => {
    const fetch = ctx.mockJson(forecastPayload);
    await getForecast(createDefaultState(), scriptedCli(), false);
    expect(fetch).not.toHaveBeenCalled();
    expect(ctx.output).toContain("No hay ciudades guardadas");
  });

  test("usa la default sin pedir selección", async () => {
    ctx.mockJson(forecastPayload);
    await getForecast(savedState(), scriptedCli(), false);
    expect(ctx.output).toContain("PRONÓSTICO 7 DÍAS");
    expect(ctx.output).toContain("Ottawa");
    expect(ctx.errors).toBe("");
  });

  test("consulta la ciudad seleccionada con las unidades de ajustes", async () => {
    const requests: URL[] = [];
    globalThis.fetch = mock(async (input: string | URL | Request) => {
      requests.push(new URL(String(input)));
      return new Response(JSON.stringify(forecastPayload));
    }) as unknown as typeof fetch;
    await getForecast({ ...savedState(), unit: "fahrenheit" }, scriptedCli("2"), true);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.searchParams.get("latitude")).toBe("-16.5");
    expect(requests[0]?.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(ctx.output).toContain("La Paz");
  });

  test("sin default permite elegir otra ciudad", async () => {
    ctx.mockJson(forecastPayload);
    await getForecast({ ...savedState(), defaultCityId: null }, scriptedCli("2"), false);
    expect(ctx.output).toContain("PRONÓSTICO 7 DÍAS");
    expect(ctx.output).toContain("La Paz");
  });

  test("cancelar no consulta la API", async () => {
    const fetch = ctx.mockJson(forecastPayload);
    await getForecast(savedState(), scriptedCli("0"), true);
    expect(fetch).not.toHaveBeenCalled();
    expect(ctx.output).not.toContain("PRONÓSTICO 7 DÍAS");
  });

  test("informa el error de la consulta", async () => {
    await getForecast(savedState(), scriptedCli(), false);
    expect(ctx.errors).toContain("No se pudo obtener el pronóstico de Ottawa");
  });
});
