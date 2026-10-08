import { afterEach, describe, expect, mock, test } from "bun:test";
import { captureConsole, fakeInput, jsonResponse, mockFetch, OTTAWA } from "../helpers.ts";
import { addCityFlow, askForNewCity } from "../../src/actions/addCity.ts";
import { createDefaultStore } from "../../src/storage/citiesStorage.ts";
import type { Store } from "../../src/types/Store.ts";

const GEOCODING_PAYLOAD = {
  results: [
    {
      id: OTTAWA.id,
      name: OTTAWA.name,
      latitude: OTTAWA.latitude,
      longitude: OTTAWA.longitude,
      country: OTTAWA.country,
      admin1: OTTAWA.region,
    },
  ],
};

function mockGeocoding(payload: unknown): void {
  mockFetch(async () => jsonResponse(payload));
}

afterEach(() => {
  mock.restore();
});

describe("askForNewCity", () => {
  test("agrega la ciudad encontrada y la informa como única/default", async () => {
    const console = captureConsole();
    const store: Store = createDefaultStore();
    mockGeocoding(GEOCODING_PAYLOAD);

    const city = await askForNewCity(store, fakeInput("Ottawa"));

    expect(city?.id).toBe(OTTAWA.id);
    expect(store.cities).toHaveLength(1);
    expect(store.defaultCity?.id).toBe(OTTAWA.id);
    expect(console.logText).toContain("Ciudad agregada: Ottawa, Ontario, Canadá");
    expect(console.logText).toContain("Es tu única ciudad");
  });

  test("no duplica una ciudad que ya está en la lista", async () => {
    const console = captureConsole();
    const store: Store = createDefaultStore();
    const seed = { ...OTTAWA };
    store.cities.push(seed);
    store.defaultCity = seed;
    mockGeocoding(GEOCODING_PAYLOAD);

    const city = await askForNewCity(store, fakeInput("Ottawa"));

    expect(city?.id).toBe(OTTAWA.id);
    expect(store.cities).toHaveLength(1);
    expect(console.logText).toContain("ya está en tu lista");
    expect(console.logText).not.toContain("Ciudad agregada");
  });

  test("informa cuando la API no encuentra la ciudad", async () => {
    const console = captureConsole();
    const store: Store = createDefaultStore();
    mockGeocoding({ generationtime_ms: 1 });

    expect(await askForNewCity(store, fakeInput("Narnia"))).toBeNull();
    expect(console.errorText).toContain('No se encontró ninguna ciudad llamada "Narnia".');
    expect(store.cities).toHaveLength(0);
  });

  test("no consulta la API si el nombre viene vacío", async () => {
    const store: Store = createDefaultStore();
    const fetchSpy = mockFetch(async () => jsonResponse({}));

    expect(await askForNewCity(store, fakeInput("   "))).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("addCityFlow", () => {
  test("siempre devuelve continue", async () => {
    captureConsole();
    mockGeocoding(GEOCODING_PAYLOAD);

    expect(await addCityFlow(createDefaultStore(), fakeInput("Ottawa"))).toBe("continue");
  });
});
