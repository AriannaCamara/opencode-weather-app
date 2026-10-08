import { afterEach, describe, expect, mock, test } from "bun:test";
import { BARCELONA, captureConsole, fakeInput, OTTAWA } from "../helpers.ts";
import { setDefaultFlow } from "../../src/actions/setDefaultCity.ts";
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

describe("setDefaultFlow", () => {
  test("cambia la ciudad default a la elegida", async () => {
    const console = captureConsole();
    const store = makeStore();

    expect(await setDefaultFlow(store, fakeInput("2"))).toBe("continue");
    expect(store.defaultCity?.id).toBe(BARCELONA.id);
    expect(console.logText).toContain("Ciudad default: Barcelona, Cataluña, España");
  });

  test("avisa si la ciudad elegida ya era la default", async () => {
    const console = captureConsole();
    const store = makeStore();

    await setDefaultFlow(store, fakeInput("1"));

    expect(store.defaultCity?.id).toBe(OTTAWA.id);
    expect(console.logText).toContain("ya es la ciudad default");
    expect(console.logText).not.toContain("Ciudad default:");
  });

  test("rechaza una selección inválida sin tocar el default", async () => {
    const console = captureConsole();
    const store = makeStore();

    expect(await setDefaultFlow(store, fakeInput("99"))).toBe("continue");
    expect(store.defaultCity?.id).toBe(OTTAWA.id);
    expect(console.errorText).toContain("Número de ciudad inválido.");
  });

  test("no pregunta nada si no hay ciudades", async () => {
    captureConsole();
    const input = fakeInput("1");

    expect(await setDefaultFlow(createDefaultStore(), input)).toBe("continue");
    expect(input.asked).toHaveLength(0);
  });
});
