import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadStore, normalizeStore, saveStore } from "./store.ts";
import type { City, Store } from "./types.ts";

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