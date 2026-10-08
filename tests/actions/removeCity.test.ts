import { afterEach, describe, expect, mock, test } from "bun:test";
import { BARCELONA, captureConsole, fakeInput, OTTAWA } from "../helpers.ts";
import { removeCityFlow } from "../../src/actions/removeCity.ts";
import { addCity, createDefaultStore } from "../../src/storage/citiesStorage.ts";
import type { Store } from "../../src/types/Store.ts";

function makeStore(ids: number[]): Store {
  const store = createDefaultStore();
  if (ids.includes(1)) addCity(store, OTTAWA);
  if (ids.includes(2)) addCity(store, BARCELONA);
  return store;
}

afterEach(() => {
  mock.restore();
});

describe("removeCityFlow", () => {
  test("elimina la ciudad confirmada y lo informa", async () => {
    const console = captureConsole();
    const store = makeStore([1, 2]);

    expect(await removeCityFlow(store, fakeInput("2", "s"))).toBe("continue");
    expect(store.cities.map((city) => city.id)).toEqual([OTTAWA.id]);
    expect(console.logText).toContain("Ciudad eliminada: Barcelona, Cataluña, España");
  });

  test("cancela cuando la respuesta es negativa", async () => {
    const console = captureConsole();
    const store = makeStore([1, 2]);

    await removeCityFlow(store, fakeInput("2", "n"));

    expect(store.cities).toHaveLength(2);
    expect(console.logText).toContain("Operación cancelada.");
    expect(console.logText).not.toContain("Ciudad eliminada");
  });

  test("cancela cuando la confirmación llega vacía (EOF)", async () => {
    const console = captureConsole();
    const store = makeStore([1, 2]);

    await removeCityFlow(store, fakeInput("2"));

    expect(store.cities).toHaveLength(2);
    expect(console.logText).toContain("Operación cancelada.");
  });

  test("con la única ciudad pide confirmación explícita y avisa al vaciar la lista", async () => {
    const console = captureConsole();
    const store = makeStore([1]);
    const input = fakeInput("1", "si");

    await removeCityFlow(store, input);

    expect(input.asked[1]).toContain("es tu única ciudad");
    expect(store.cities).toEqual([]);
    expect(store.defaultCity).toBeNull();
    expect(console.logText).toContain("Ahora no queda ninguna ciudad guardada.");
  });

  test("no pregunta nada si no hay ciudades", async () => {
    const console = captureConsole();
    const input = fakeInput("1");

    expect(await removeCityFlow(createDefaultStore(), input)).toBe("continue");
    expect(input.asked).toHaveLength(0);
    expect(console.logText).toContain("No tenés ciudades guardadas");
  });

  test("devuelve continue ante una selección inválida", async () => {
    const console = captureConsole();
    const store = makeStore([1, 2]);

    expect(await removeCityFlow(store, fakeInput("99", "s"))).toBe("continue");
    expect(store.cities).toHaveLength(2);
    expect(console.errorText).toContain("Número de ciudad inválido.");
  });
});
