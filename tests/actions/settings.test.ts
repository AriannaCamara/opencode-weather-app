import { afterEach, describe, expect, mock, test } from "bun:test";
import { captureConsole, fakeInput } from "../helpers.ts";
import { settingsFlow } from "../../src/actions/settings.ts";
import { createDefaultStore } from "../../src/storage/citiesStorage.ts";

afterEach(() => {
  mock.restore();
});

describe("settingsFlow", () => {
  test("muestra la unidad actual antes de preguntar", async () => {
    const console = captureConsole();

    await settingsFlow(createDefaultStore(), fakeInput("n"));

    expect(console.logText).toContain("Unidad actual: Celsius (°C)");
  });

  test("alterna a Fahrenheit cuando se confirma", async () => {
    const console = captureConsole();
    const store = createDefaultStore();
    const input = fakeInput("s");

    expect(await settingsFlow(store, input)).toBe("continue");
    expect(store.unit).toBe("fahrenheit");
    expect(input.asked[0]).toContain("Fahrenheit (°F)");
    expect(console.logText).toContain("Unidad actualizada: Fahrenheit (°F)");
  });

  test("mantiene la unidad cuando se rechaza", async () => {
    const console = captureConsole();
    const store = createDefaultStore();

    await settingsFlow(store, fakeInput("n"));

    expect(store.unit).toBe("celsius");
    expect(console.logText).toContain("Sin cambios.");
  });

  test("mantiene la unidad si no hay respuesta (EOF)", async () => {
    const console = captureConsole();
    const store = createDefaultStore();

    await settingsFlow(store, fakeInput());

    expect(store.unit).toBe("celsius");
    expect(console.logText).toContain("Sin cambios.");
  });

  test("devuelve siempre continue", async () => {
    captureConsole();
    const store = createDefaultStore();

    expect(await settingsFlow(store, fakeInput("s"))).toBe("continue");
    expect(store.unit).toBe("fahrenheit");
  });
});
