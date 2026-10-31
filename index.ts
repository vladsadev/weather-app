import { runCli } from "./src/cli";

runCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n  Error inesperado: ${message}`);
  process.exitCode = 1;
});
