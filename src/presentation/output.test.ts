import { describe, expect, test } from "bun:test";
import type { City } from "../types/City";
import type { Forecast } from "../types/Weather";
import { visualWidth } from "../utils/format";
import { renderForecast } from "./output";

const city: City = {
  id: 1,
  name: "Ottawa",
  latitude: 45.42,
  longitude: -75.7,
  admin1: "Ontario",
  country: "Canadá",
};

const forecast: Forecast = {
  current: {
    temperature: 3.4,
    apparentTemperature: -0.2,
    humidity: 57,
    weatherCode: 2,
    windSpeed: 6.1,
    unit: "°C",
    windUnit: "km/h",
    time: "2026-10-31T19:45",
  },
  daily: [
    {
      date: "2026-10-31",
      weatherCode: 0,
      minimum: -0.8,
      maximum: 8.2,
      precipitationProbability: 0,
      windSpeedMax: 12.6,
    },
    {
      date: "2026-11-01",
      weatherCode: 2,
      minimum: 0,
      maximum: 14.6,
      precipitationProbability: 45,
      windSpeedMax: 12.3,
    },
    {
      date: "2026-11-02",
      weatherCode: 2,
      minimum: 7.9,
      maximum: 17.7,
      precipitationProbability: 100,
      windSpeedMax: 12.4,
    },
    {
      date: "2026-11-03",
      weatherCode: 61,
      minimum: 10.9,
      maximum: 12.7,
      precipitationProbability: null,
      windSpeedMax: null,
    },
    {
      date: "2026-11-04",
      weatherCode: 95,
      minimum: 10.4,
      maximum: 19.4,
      precipitationProbability: 40,
      windSpeedMax: 23.2,
    },
    {
      date: "2026-11-05",
      weatherCode: 75,
      minimum: 10.2,
      maximum: 15.1,
      precipitationProbability: 48,
      windSpeedMax: 16.1,
    },
    {
      date: "2026-11-06",
      weatherCode: 3,
      minimum: 7.6,
      maximum: 10.8,
      precipitationProbability: 42,
      windSpeedMax: 22.7,
    },
  ],
  temperatureUnit: "°C",
  windUnit: "km/h",
  precipitationUnit: "%",
};

describe("renderForecast", () => {
  test("la tabla no supera el ancho de una terminal de 80 columnas", () => {
    const lines = renderForecast(city, forecast, "celsius");

    for (const line of lines) {
      expect(visualWidth(line)).toBeLessThanOrEqual(80);
    }
  });

  test("mantiene alineadas las filas y las reglas", () => {
    const lines = renderForecast(city, forecast, "celsius");
    const rows = lines.filter((line) => line.includes("Hoy"));
    const rules = lines.filter((line) => line.includes("─"));

    expect(rows).toHaveLength(1);
    expect(rules).toHaveLength(3);

    const ruleWidth = visualWidth(rules[0] ?? "");
    const header = lines.find((line) => line.includes("Condición"));

    expect(header).toBeDefined();
    expect(visualWidth(header ?? "")).toBe(ruleWidth);
  });

  test("incluye las condiciones actuales y los siete días", () => {
    const text = renderForecast(city, forecast, "celsius").join("\n");

    expect(text).toContain("PRONÓSTICO 7 DÍAS");
    expect(text).toContain("Ottawa, Ontario, Canadá");
    expect(text).toContain("Parcialmente nublado");
    expect(text).toContain("Tormenta");
    expect(text).toContain("100%");
    expect(text).toContain("Mañana dom 1");
  });

  test("no genera nada sin días", () => {
    expect(renderForecast(city, { ...forecast, daily: [] }, "celsius")).toEqual(
      [],
    );
  });
});
