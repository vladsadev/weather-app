import { mkdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJson {
  version?: unknown;
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const packageJson = (await Bun.file(
  join(projectRoot, "package.json"),
).json()) as PackageJson;

const version =
  typeof packageJson.version === "string" ? packageJson.version.trim() : "";

if (!version) {
  console.error("package.json debe definir una versión no vacía.");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Versión inválida en package.json: ${version}`);
  process.exit(1);
}

const target = process.env.BUILD_TARGET?.trim() || undefined;
const outfile = process.env.BUILD_OUTFILE?.trim() || "dist/weather";

await mkdir(dirname(outfile), { recursive: true });

const args = [
  process.execPath,
  "build",
  "--compile",
  join(projectRoot, "src/index.ts"),
  "--outfile",
  outfile,
  ...(target ? [`--target=${target}`] : []),
  "--define",
  `__APP_VERSION__=${JSON.stringify(version)}`,
];

console.log(
  `Compilando ${relative(process.cwd(), outfile)} (${target ?? "host"}) con versión ${version}...`,
);

const result = Bun.spawnSync({
  cmd: args,
  cwd: process.cwd(),
  stdout: "inherit",
  stderr: "inherit",
});

if (result.exitCode !== 0) {
  process.exit(result.exitCode ?? 1);
}
