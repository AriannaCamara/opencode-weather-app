import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ENTRY = join(import.meta.dir, "..", "src", "index.ts");

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

// La app se corre como subprocess: src/index.ts llama a main() a nivel de módulo,
// así que importarlo en el test arrancaría el loop real de stdin.
async function runApp(stdin: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "weather-app-"));
  dirs.push(cwd);

  const proc = Bun.spawn([process.execPath, "run", ENTRY], {
    cwd,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  proc.stdin.write(stdin);
  proc.stdin.end();

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  return { exitCode, stdout, stderr };
}

describe("smoke test de la CLI", () => {
  test("arranca, muestra el menú y sale con la opción 9", async () => {
    const { exitCode, stdout } = await runApp("9\n");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("WEATHER CLI");
    expect(stdout).toContain("Clima de ciudad default");
    expect(stdout).toContain("¡Hasta luego!");
  });

  test("sale con el fin de archivo (Ctrl+D)", async () => {
    const { exitCode, stdout } = await runApp("");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Saliendo...");
  });

  test("una opción inválida muestra error y sigue en el menú", async () => {
    const { exitCode, stderr, stdout } = await runApp("7\n9\n");

    expect(exitCode).toBe(0);
    expect(stderr).toContain('Opción inválida: "7"');
    expect(stdout).toContain("¡Hasta luego!");
  });

  test("al salir persiste el store en data/cities.json", async () => {
    const { exitCode } = await runApp("9\n");
    const cwd = dirs[dirs.length - 1];

    expect(exitCode).toBe(0);
    expect(await Bun.file(join(cwd ?? "", "data", "cities.json")).exists()).toBe(true);
  });
});
