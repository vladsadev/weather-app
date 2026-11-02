import { afterEach, describe, expect, test } from "bun:test";
import type { City } from "../types/City";
import { fetchCurrentWeather, fetchForecast } from "./weather";

const originalFetch = globalThis.fetch;

const city: City = {
  id: 1,
  name: "Ottawa",
  latitude: 45.42,
  longitude: -75.7,
};

let requestedUrl: URL | null = null;

function mockJson(payload: unknown, init: ResponseInit = {}): void {
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = new URL(String(input));
    return new Response(JSON.stringify(payload), init);
  }) as typeof fetch;
}

function mockFailure(error: Error): void {
  globalThis.fetch = (async () => {
    throw error;
  }) as unknown as typeof fetch;
}

const currentPayload = {
  current_units: {
    temperature_2m: "°C",
    wind_speed_10m: "km/h",
  },
  current: {
    temperature_2m: 3.4,
    apparent_temperature: -0.2,
    relative_humidity_2m: 57,
    weather_code: 0,
    wind_speed_10m: 6.1,
    time: "2026-10-31T19:45",
  },
};

const dailyPayload = {
  ...currentPayload,
  daily_units: {
    temperature_2m_max: "°C",
    wind_speed_10m_max: "km/h",
    precipitation_probability_max: "%",
  },
  daily: {
    time: [
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
    ],
    weather_code: [0, 1, 2, 3, 61, 63, 95],
    temperature_2m_max: [8.2, 14.6, 17.7, 12.7, 19.4, 15.1, 10.8],
    temperature_2m_min: [-0.8, 0.0, 7.9, 10.9, 10.4, 10.2, 7.6],
    precipitation_probability_max: [0, 3, 5, 45, 40, 48, 42],
    wind_speed_10m_max: [12.6, 12.3, 12.4, 10.5, 23.2, 16.1, 22.7],
  },
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  requestedUrl = null;
});

describe("fetchCurrentWeather", () => {
  test("mapea el clima actual y sus unidades", async () => {
    mockJson(currentPayload);

    const weather = await fetchCurrentWeather(city, "celsius");

    expect(weather).toEqual({
      temperature: 3.4,
      apparentTemperature: -0.2,
      humidity: 57,
      weatherCode: 0,
      windSpeed: 6.1,
      unit: "°C",
      windUnit: "km/h",
      time: "2026-10-31T19:45",
    });
    expect(requestedUrl?.searchParams.get("current")).toContain(
      "apparent_temperature",
    );
    expect(requestedUrl?.searchParams.get("temperature_unit")).toBe("celsius");
    expect(requestedUrl?.searchParams.get("wind_speed_unit")).toBe("kmh");
    expect(requestedUrl?.searchParams.get("precipitation_unit")).toBe("mm");
  });

  test("pide unidades imperiales para Fahrenheit", async () => {
    mockJson(currentPayload);

    await fetchCurrentWeather(city, "fahrenheit");

    expect(requestedUrl?.searchParams.get("temperature_unit")).toBe(
      "fahrenheit",
    );
    expect(requestedUrl?.searchParams.get("wind_speed_unit")).toBe("mph");
    expect(requestedUrl?.searchParams.get("precipitation_unit")).toBe("inch");
  });

  test("falla si no hay temperatura", async () => {
    mockJson({ current: {} });

    await expect(fetchCurrentWeather(city, "celsius")).rejects.toThrow(
      /temperatura válida/,
    );
  });

  test("normaliza la unidad de viento de Open-Meteo", async () => {
    mockJson({
      ...currentPayload,
      current_units: {
        temperature_2m: "°F",
        wind_speed_10m: "mp/h",
      },
    });

    const weather = await fetchCurrentWeather(city, "fahrenheit");

    expect(weather.windUnit).toBe("mph");
  });
});

describe("fetchForecast", () => {
  test("mapea los siete días y las unidades diarias", async () => {
    mockJson(dailyPayload);

    const forecast = await fetchForecast(city, "celsius");

    expect(forecast.daily).toHaveLength(7);
    expect(forecast.daily[0]).toEqual({
      date: "2026-10-31",
      weatherCode: 0,
      minimum: -0.8,
      maximum: 8.2,
      precipitationProbability: 0,
      windSpeedMax: 12.6,
    });
    expect(forecast.temperatureUnit).toBe("°C");
    expect(forecast.windUnit).toBe("km/h");
    expect(forecast.precipitationUnit).toBe("%");
    expect(forecast.current.temperature).toBe(3.4);
    expect(requestedUrl?.searchParams.get("daily")).toContain(
      "temperature_2m_max",
    );
    expect(requestedUrl?.searchParams.get("forecast_days")).toBe("7");
  });

  test("omite los días incompletos y falla si no queda ninguno", async () => {
    mockJson({
      ...dailyPayload,
      daily: {
        time: ["2026-10-31", "2026-11-01"],
        temperature_2m_max: [8.2],
        temperature_2m_min: [-0.8, 0],
      },
    });

    const forecast = await fetchForecast(city, "celsius");
    expect(forecast.daily).toHaveLength(1);

    mockJson({ ...dailyPayload, daily: {} });

    await expect(fetchForecast(city, "celsius")).rejects.toThrow(
      /pronóstico válido/,
    );
  });
});

describe("errores de red", () => {
  test("informa un problema de conexión", async () => {
    mockFailure(new Error("sin red"));

    await expect(fetchCurrentWeather(city, "celsius")).rejects.toThrow(
      /No se pudo conectar/,
    );
  });

  test("informa el código HTTP", async () => {
    mockJson({}, { status: 500 });

    await expect(fetchCurrentWeather(city, "celsius")).rejects.toThrow(
      /HTTP 500/,
    );
  });

  test("informa una respuesta inválida", async () => {
    globalThis.fetch = (async () =>
      new Response("no es json", { status: 200 })) as unknown as typeof fetch;

    await expect(fetchCurrentWeather(city, "celsius")).rejects.toThrow(
      /respuesta inválida/,
    );
  });
});
