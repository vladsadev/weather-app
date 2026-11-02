import { REQUEST_TIMEOUT_MS } from "../utils/constants";

export async function fetchJson<T>(url: URL): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con Open-Meteo. Revisa tu conexión a internet.",
    );
  }

  if (!response.ok) {
    throw new Error(`Open-Meteo respondió con un error HTTP ${response.status}.`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Open-Meteo devolvió una respuesta inválida.");
  }
}
