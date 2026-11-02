import { afterEach, describe, expect, test } from "bun:test";
import { searchCities } from "./geocoding";

const originalFetch = globalThis.fetch;

let requestedUrl: URL | null = null;

function mockJson(payload: unknown, init: ResponseInit = {}): void {
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = new URL(String(input));
    return new Response(JSON.stringify(payload), init);
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  requestedUrl = null;
});

describe("searchCities", () => {
  test("pide varios resultados y descarta los inválidos", async () => {
    mockJson({
      results: [
        {
          id: 1,
          name: " Ottawa ",
          latitude: 45.42,
          longitude: -75.7,
          admin1: "Ontario",
          country: "Canadá",
        },
        { id: "inválido", name: "Nada", latitude: 0, longitude: 0 },
        { id: 2, name: "   ", latitude: 1, longitude: 1 },
      ],
    });

    const results = await searchCities("Ottawa");

    expect(results).toEqual([
      {
        id: 1,
        name: "Ottawa",
        latitude: 45.42,
        longitude: -75.7,
        admin1: "Ontario",
        country: "Canadá",
      },
    ]);
    expect(requestedUrl?.searchParams.get("count")).toBe("8");
    expect(requestedUrl?.searchParams.get("language")).toBe("es");
  });

  test("devuelve una lista vacía sin resultados", async () => {
    mockJson({});

    expect(await searchCities("Atlantis")).toEqual([]);
  });
});
