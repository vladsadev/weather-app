# Agent notes

- This is a Bun/TypeScript ESM project. Use Bun and keep `bun.lock` in sync when changing dependencies. See `@bun-instructions.md` for Bun-specific APIs.
- `src/index.ts` es el punto de entrada; ejecuta el CLI con `bun src/index.ts` o `bun start`. Genera un binario con `bun run build` (por defecto `dist/weather`); `BUILD_TARGET` y `BUILD_OUTFILE` permiten compilar otros destinos. La versión de `package.json` se inyecta con `--define` y se reporta con `--version`.
- Verifica tipos con `bun run typecheck` (ejecuta `bun check`) y corre la suite con `bun test` (archivos en `tests/**/*.test.ts`, replicando la estructura de `src/`). Usa `bun run test:coverage` para cobertura; `tests/helpers/` contiene utilidades y `tests/e2e/` las pruebas del CLI como proceso real.
- Releases: actualiza `version` en `package.json` y haz push a `main`. `.github/workflows/release.yml` ejecuta tipos y tests, compila todos los destinos, crea el tag `v<version>` y publica el release; si falla, reanuda el borrador. `.bun-version` es la fuente única de la versión de Bun para ambos workflows.
- Organización del código:
  - `src/actions/`: acciones del menú (clima, pronóstico, alta, eliminación, ciudad default, ajustes y listado).
  - `src/presentation/`: menú, entrada de usuario y salida por consola (mensajes, spinner y renderizado).
  - `src/storage/`: lectura/escritura de `config.json` y operaciones sobre ciudades.
  - `src/types/`: contratos compartidos (`City`, `Weather`, `AppState`, `MenuOption`).
  - `src/api/`: cliente HTTP y acceso a Geocoding y Forecast de Open-Meteo.
  - `src/utils/`: formato, colores, constantes y códigos WMO.
  - `scripts/build.ts`: compilación con la versión inyectada y destino configurable.
- Saved state lives at `$WEATHER_CLI_HOME/config.json`, falling back to `$XDG_CONFIG_HOME/weather-cli/config.json` or `~/.config/weather-cli/config.json`. Set `WEATHER_CLI_HOME` to a temp directory when testing manually.
- The README is the product spec. Keep the menu labels and numbering (1–7, 8, 9) aligned with it, and use Open-Meteo's Geocoding API before the Forecast API.
- Colors (cyan menu, yellow temperatures, green success, red errors) are centralized in `src/utils/colors.ts`; they turn off without a TTY or with `NO_COLOR`, and `FORCE_COLOR=1` forces them on.
- No API key or `.env` is required; both Open-Meteo endpoints are public and called with the global `fetch`.
