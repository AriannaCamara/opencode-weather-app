import { afterEach, describe, expect, test } from "bun:test";
import { createPalette, shouldUseColor } from "./colors.ts";

const ENV_KEYS = ["NO_COLOR", "FORCE_COLOR", "TERM"] as const;

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("createPalette", () => {
  test("devuelve códigos vacíos si el color está deshabilitado", () => {
    for (const code of Object.values(createPalette(false))) {
      expect(code).toBe("");
    }
  });

  test("devuelve códigos ANSI si el color está habilitado", () => {
    const palette = createPalette(true);

    expect(palette.reset).toBe("\u001B[0m");
    for (const [style, code] of Object.entries(palette)) {
      if (style === "reset") continue;
      expect(code).toMatch(/^\u001B\[\d+m$/);
    }
  });
});

describe("shouldUseColor", () => {
  test("deshabilita el color con NO_COLOR", () => {
    process.env.NO_COLOR = "1";

    expect(shouldUseColor()).toBe(false);
  });

  test("ignora NO_COLOR vacío, tal como pide la spec", () => {
    process.env.NO_COLOR = "";
    process.env.FORCE_COLOR = "1";

    expect(shouldUseColor()).toBe(true);
  });

  test("FUERZA_COLOR fuerza el color aunque no sea TTY", () => {
    process.env.FORCE_COLOR = "1";

    expect(withIsTTY(false, shouldUseColor)).toBe(true);
  });

  test("FUERZA_COLOR=0 y =false apagan el color", () => {
    process.env.FORCE_COLOR = "0";
    expect(withIsTTY(true, shouldUseColor)).toBe(false);

    process.env.FORCE_COLOR = "false";
    expect(withIsTTY(true, shouldUseColor)).toBe(false);
  });

  test("deshabilita el color en terminales dumb", () => {
    process.env.TERM = "dumb";

    expect(withIsTTY(true, shouldUseColor)).toBe(false);
  });

  test("habilita el color cuando stdout es una terminal", () => {
    expect(withIsTTY(true, shouldUseColor)).toBe(true);
  });

  test("sin TTY el color queda apagado, para no ensuciar logs redirigidos", () => {
    expect(withIsTTY(false, shouldUseColor)).toBe(false);
  });
});

function withIsTTY<T>(isTTY: boolean, run: () => T): T {
  const original = process.stdout.isTTY;
  Object.defineProperty(process.stdout, "isTTY", { value: isTTY, configurable: true });

  try {
    return run();
  } finally {
    Object.defineProperty(process.stdout, "isTTY", { value: original, configurable: true });
  }
}
