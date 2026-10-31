# Agent notes

- This is a Bun/TypeScript ESM project. Use Bun and keep `bun.lock` in sync when changing dependencies.
- `index.ts` is the app entrypoint; run it with `bun index.ts`. There is no dev script.
- Verify types with `bun run typecheck` (runs `bun check`). No test or lint scripts are configured; use `bun test` for tests if added.
- The README describes the intended weather CLI and Open-Meteo flow; the current entrypoint is only a placeholder, so verify implemented behavior in code.
- puedes usar `@bun-instructions.md` para obtener instrucciones de Bun.D