import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { City } from "../../src/types/City.ts";
import type { Store } from "../../src/types/Store.ts";
import {
  addCity,
  createDefaultStore,
  findCityById,
  loadStore,
  normalizeStore,
  removeCity,
  saveStore,
  setDefaultCity,
  toggleUnit,
} from "../../src/storage/citiesStorage.ts";

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

const OTTAWA: City = {
  id: 6094817,
  name: "Ottawa",
  country: "Canadá",
  region: "Ontario",
  latitude: 45.41117,
  longitude: -75.69812,
};

let dir = "";
let path = "";

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "weather-cli-"));
  path = join(dir, "nested", "cities.json");
});

afterEach(async () => {
  mock.restore();
  await rm(dir, { recursive: true, force: true });
});

describe("normalizeStore", () => {
  test("devuelve null si cities no es un array", () => {
    expect(normalizeStore({ cities: "muchas" })).toBeNull();
    expect(normalizeStore(null)).toBeNull();
  });

  test("descarta ciudades inválidas sin tirar todo el store", () => {
    const store = normalizeStore({ cities: [OTTAWA, { name: "sin id" }, null] });

    expect(store?.cities).toEqual([OTTAWA]);
  });

  test("reparte el default a la primera ciudad si el guardado no está en la lista", () => {
    const ausente: City = { ...OTTAWA, id: 42, name: "Barcelona" };
    const store = normalizeStore({ cities: [OTTAWA], defaultCity: ausente });

    expect(store?.defaultCity?.id).toBe(OTTAWA.id);
  });

  test("descarta cualquier unidad desconocida y usa celsius", () => {
    expect(normalizeStore({ cities: [], unit: "kelvin" })?.unit).toBe("celsius");
    expect(normalizeStore({ cities: [], unit: "fahrenheit" })?.unit).toBe("fahrenheit");
  });

  test("deja el default en null si no hay ciudades", () => {
    expect(normalizeStore({ cities: [] })?.defaultCity).toBeNull();
  });
});

describe("loadStore", () => {
  test("devuelve el store por defecto si el archivo no existe", async () => {
    expect(await loadStore(path)).toEqual({ defaultCity: null, cities: [], unit: "celsius" });
  });

  test("devuelve el store por defecto si el JSON está corrupto", async () => {
    spyOn(console, "warn").mockImplementation(() => {});
    await Bun.write(path, "{ esto no es json");

    expect(await loadStore(path)).toEqual({ defaultCity: null, cities: [], unit: "celsius" });
  });

  test("lee un store válido del disco", async () => {
    const store: Store = { defaultCity: OTTAWA, cities: [OTTAWA], unit: "fahrenheit" };
    await saveStore(store, path);

    expect(await loadStore(path)).toEqual(store);
  });
});

describe("saveStore", () => {
  test("crea los directorios que faltan", async () => {
    await saveStore({ defaultCity: OTTAWA, cities: [OTTAWA], unit: "celsius" }, path);

    expect(await Bun.file(path).exists()).toBe(true);
  });

  test("sobrevive a un round-trip con varias ciudades y Fahrenheit", async () => {
    const barcelona: City = { ...OTTAWA, id: 3128760, name: "Barcelona", region: "Cataluña", country: "España" };
    const store: Store = { defaultCity: barcelona, cities: [OTTAWA, barcelona], unit: "fahrenheit" };

    await saveStore(store, path);

    expect(await loadStore(path)).toEqual(store);
  });

  test("deja el default apuntando a una ciudad real tras el round-trip", async () => {
    const store: Store = { defaultCity: OTTAWA, cities: [OTTAWA], unit: "celsius" };
    await saveStore(store, path);
    store.cities = [];

    expect((await loadStore(path)).defaultCity).toEqual(OTTAWA);
  });
});
