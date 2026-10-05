import { describe, expect, test } from "bun:test";
import { addCity, createDefaultStore, findCityById, removeCity, setDefaultCity, toggleUnit } from "./cities.ts";
import type { City, Store } from "./types.ts";

function makeCity(id: number, name = `Ciudad ${id}`): City {
  return {
    id,
    name,
    country: "Argentina",
    region: "Buenos Aires",
    latitude: -34.6,
    longitude: -58.38,
  };
}

function makeStore(ids: number[]): Store {
  const store = createDefaultStore();
  for (const id of ids) addCity(store, makeCity(id));
  return store;
}

describe("createDefaultStore", () => {
  test("arranca vacío, en Celsius y sin default", () => {
    expect(createDefaultStore()).toEqual({ defaultCity: null, cities: [], unit: "celsius" });
  });

  test("devuelve un objeto nuevo en cada llamada", () => {
    expect(createDefaultStore()).not.toBe(createDefaultStore());
  });
});

describe("addCity", () => {
  test("agrega la ciudad y la deja como default si no había ninguna", () => {
    const store = createDefaultStore();
    const city = makeCity(1, "Ottawa");

    expect(addCity(store, city)).toBe(city);
    expect(store.cities).toHaveLength(1);
    expect(store.defaultCity).toEqual(city);
  });

  test("no pisa el default que ya existía", () => {
    const store = makeStore([1]);

    addCity(store, makeCity(2));

    expect(store.defaultCity?.id).toBe(1);
  });

  test("deduplica por id y devuelve la ya guardada", () => {
    const store = makeStore([1]);
    const duplicada = makeCity(1, "Otro nombre");

    const result = addCity(store, duplicada);

    expect(store.cities).toHaveLength(1);
    expect(result.name).toBe("Ciudad 1");
  });
});

describe("findCityById", () => {
  test("devuelve la ciudad si existe y null si no", () => {
    const store = makeStore([1, 2]);

    expect(findCityById(store, 2)?.id).toBe(2);
    expect(findCityById(store, 99)).toBeNull();
  });
});

describe("removeCity", () => {
  test("elimina la ciudad y la devuelve", () => {
    const store = makeStore([1, 2]);

    const removed = removeCity(store, 1);

    expect(removed?.id).toBe(1);
    expect(store.cities.map((city) => city.id)).toEqual([2]);
  });

  test("devuelve null y no muta el store si el id no existe", () => {
    const store = makeStore([1, 2]);

    expect(removeCity(store, 99)).toBeNull();
    expect(store.cities).toHaveLength(2);
  });

  test("al borrar el default pasa la primera ciudad restante", () => {
    const store = makeStore([1, 2, 3]);

    removeCity(store, 1);

    expect(store.defaultCity?.id).toBe(2);
  });

  test("al borrar la última ciudad el default queda en null", () => {
    const store = makeStore([1]);

    removeCity(store, 1);

    expect(store.cities).toEqual([]);
    expect(store.defaultCity).toBeNull();
  });
});

describe("setDefaultCity", () => {
  test("marca la ciudad indicada como default", () => {
    const store = makeStore([1, 2]);

    const result = setDefaultCity(store, 2);

    expect(result?.id).toBe(2);
    expect(store.defaultCity?.id).toBe(2);
  });

  test("devuelve null y no muta el store si el id no existe", () => {
    const store = makeStore([1]);

    expect(setDefaultCity(store, 99)).toBeNull();
    expect(store.defaultCity?.id).toBe(1);
  });
});

describe("toggleUnit", () => {
  test("alterna entre celsius y fahrenheit", () => {
    expect(toggleUnit("celsius")).toBe("fahrenheit");
    expect(toggleUnit("fahrenheit")).toBe("celsius");
  });
});