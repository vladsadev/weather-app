# Agent notes

- This is a Bun/TypeScript ESM project. Use Bun and keep `bun.lock` in sync when changing dependencies. See `@bun-instructions.md` for Bun-specific APIs.
- `index.ts` is the entrypoint; run the CLI with `bun index.ts` or `bun start`. Build a standalone binary with `bun run build` (outputs `dist/weather`).
- Verify types with `bun run typecheck` (runs `bun check`). No test or lint scripts are configured; use `bun test` if tests are added.
- Source layout: `src/openMeteo.ts` wraps the Geocoding and Forecast APIs, `src/config.ts` loads/saves state, and `src/cli.ts` owns the interactive menu and actions.
- Saved state lives at `$WEATHER_CLI_HOME/config.json`, falling back to `$XDG_CONFIG_HOME/weather-cli/config.json` or `~/.config/weather-cli/config.json`. Set `WEATHER_CLI_HOME` to a temp directory when testing manually.
- The README is the product spec. Keep the menu labels and numbering (1–5, 8, 9) aligned with it, and use Open-Meteo's Geocoding API before the Forecast API.
- No API key or `.env` is required; both Open-Meteo endpoints are public and called with the global `fetch`.
