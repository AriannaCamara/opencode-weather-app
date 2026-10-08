import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { captureConsole, currentPayload, fakeInput, jsonResponse, mockFetch, OTTAWA } from "../helpers.ts";
import type { ConsoleCapture } from "../helpers.ts";
import { runMenuLoop, renderMenu } from "../../src/presentation/menu.ts";
import type { Store } from "../../src/types/Store.ts";
import { createDefaultStore } from "../../src/storage/citiesStorage.ts";

let store: Store;
let console: ConsoleCapture;

beforeEach(() => {
  store = createDefaultStore();
  console = captureConsole();
});

afterEach(() => {
  mock.restore();
});

describe("renderMenu", () => {
  test("lista todas las opciones con el conteo de ciudades y la unidad", () => {
    store.cities.push(OTTAWA);
    store.defaultCity = OTTAWA;
    store.unit = "fahrenheit";

    renderMenu(store);

    expect(console.logText).toContain("Clima de ciudad default");
    expect(console.logText).toContain("Clima de todas las ciudades (1)");
    expect(console.logText).toContain("Pronóstico 7 días");
    expect(console.logText).toContain("Ajustes (°F)");
    expect(console.logText).toContain("Salir");
  });
});

describe("runMenuLoop", () => {
  test("la opción 9 sale con despedida", async () => {
    await runMenuLoop(store, fakeInput("9"));

    expect(console.logText).toContain("¡Hasta luego!");
  });

  test("el fin de archivo (null) sale sin despedida formal", async () => {
    await runMenuLoop(store, fakeInput());

    expect(console.logText).toContain("Saliendo...");
    expect(console.logText).not.toContain("¡Hasta luego!");
  });

  test("una opción vacía vuelve a mostrar el menú", async () => {
    const input = fakeInput("", "9");

    await runMenuLoop(store, input);

    expect(console.errorText).not.toContain("Opción inválida");
    expect(input.asked).toHaveLength(2);
  });

  test("una opción desconocida muestra error y sigue en el loop", async () => {
    await runMenuLoop(store, fakeInput("7", "9"));

    expect(console.errorText).toContain('Opción inválida: "7"');
    expect(console.logText).toContain("¡Hasta luego!");
  });

  test("la opción 8 apaga el toggle de unidades", async () => {
    const input = fakeInput("8", "s", "9");

    await runMenuLoop(store, input);

    expect(store.unit).toBe("fahrenheit");
    expect(console.logText).toContain("Unidad actualizada: Fahrenheit (°F)");
    expect(input.asked).toHaveLength(3);
  });

  test("un error de red en la opción 1 no rompe el loop", async () => {
    store.defaultCity = OTTAWA;
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });

    await runMenuLoop(store, fakeInput("1", "9"));

    expect(console.errorText).toContain("No se pudo consultar");
    expect(console.logText).toContain("¡Hasta luego!");
  });

  test("la opción 1 renderiza el clima del default cuando la API responde", async () => {
    store.defaultCity = OTTAWA;
    mockFetch(async () => jsonResponse(currentPayload()));

    await runMenuLoop(store, fakeInput("1", "9"));

    expect(console.logText).toContain("Temperatura: 10.8 °C");
  });

  test("la opción 2 avisa si no hay ciudades guardadas", async () => {
    await runMenuLoop(store, fakeInput("2", "9"));

    expect(console.logText).toContain("No tenés ciudades guardadas");
  });
});
