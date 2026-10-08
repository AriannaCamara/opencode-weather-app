import { afterEach, describe, expect, mock, test } from "bun:test";
import { BARCELONA, captureConsole, fakeInput, OTTAWA } from "../helpers.ts";
import { pickCityFromList } from "../../src/actions/listCities.ts";
import { addCity, createDefaultStore } from "../../src/storage/citiesStorage.ts";
import type { Store } from "../../src/types/Store.ts";

function makeStore(): Store {
  const store = createDefaultStore();
  addCity(store, OTTAWA);
  addCity(store, BARCELONA);
  return store;
}

afterEach(() => {
  mock.restore();
});

describe("pickCityFromList", () => {
  test("sin ciudades guardadas avisa y no llega a preguntar", async () => {
    const console = captureConsole();
    const input = fakeInput("1");

    expect(await pickCityFromList(createDefaultStore(), input)).toBeNull();
    expect(console.logText).toContain("No tenés ciudades guardadas");
    expect(input.asked).toHaveLength(0);
  });

  test("renderiza la lista marcando la ciudad default", async () => {
    const console = captureConsole();

    await pickCityFromList(makeStore(), fakeInput("1"));

    expect(console.logText).toContain("1. Ottawa, Ontario, Canadá");
    expect(console.logText).toContain("2. Barcelona, Cataluña, España");
    expect(console.logText).toContain("★ default");
  });

  test("devuelve la ciudad elegida por su número", async () => {
    captureConsole();
    const input = fakeInput("2");

    const city = await pickCityFromList(makeStore(), input);

    expect(city?.id).toBe(BARCELONA.id);
    expect(input.asked[0]).toContain("Número de ciudad");
  });

  test("rechaza números fuera de rango", async () => {
    const console = captureConsole();

    expect(await pickCityFromList(makeStore(), fakeInput("99"))).toBeNull();
    expect(console.errorText).toContain("Número de ciudad inválido.");
  });

  test("rechaza el 0 porque no hay ciudad en esa posición", async () => {
    const console = captureConsole();

    expect(await pickCityFromList(makeStore(), fakeInput("0"))).toBeNull();
    expect(console.errorText).toContain("Número de ciudad inválido.");
  });

  test("rechaza respuestas no numéricas", async () => {
    const console = captureConsole();

    expect(await pickCityFromList(makeStore(), fakeInput("abc"))).toBeNull();
    expect(console.errorText).toContain("Número de ciudad inválido.");
  });

  test("rechaza la selección cuando llega el fin de archivo", async () => {
    const console = captureConsole();

    expect(await pickCityFromList(makeStore(), fakeInput())).toBeNull();
    expect(console.errorText).toContain("Número de ciudad inválido.");
  });
});
