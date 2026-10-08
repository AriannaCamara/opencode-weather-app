import { afterEach, describe, expect, mock, test } from "bun:test";
import { BARCELONA, captureConsole, currentPayload, fakeInput, jsonResponse, mockFetch, OTTAWA } from "../helpers.ts";
import { showAllWeather, showDefaultWeather } from "../../src/actions/getWeather.ts";
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

describe("showDefaultWeather", () => {
  test("consulta y renderiza el clima de la ciudad default", async () => {
    const console = captureConsole();
    const store = makeStore();
    const fetchSpy = mockFetch(async () => jsonResponse(currentPayload()));

    expect(await showDefaultWeather(store, fakeInput())).toBe("continue");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(console.logText).toContain("Ottawa, Ontario, Canadá");
    expect(console.logText).toContain("Temperatura: 10.8 °C");
    expect(console.logText).toContain("★");
  });

  test("si no hay default pide una ciudad y sigue sin clima si el nombre está vacío", async () => {
    const console = captureConsole();
    const store = createDefaultStore();
    const fetchSpy = mockFetch(async () => jsonResponse(currentPayload()));

    expect(await showDefaultWeather(store, fakeInput(""))).toBe("continue");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(console.errorText).toBe("");
  });

  test("propaga el error de la API para que el menú lo capture", async () => {
    const store = makeStore();
    mockFetch(async () => new Response("boom", { status: 500 }));

    await expect(showDefaultWeather(store, fakeInput())).rejects.toThrow(/500/);
  });
});

describe("showAllWeather", () => {
  test("avisa si no hay ciudades guardadas", async () => {
    const console = captureConsole();

    expect(await showAllWeather(createDefaultStore())).toBe("continue");
    expect(console.logText).toContain("No tenés ciudades guardadas");
  });

  test("renderiza el clima de todas las ciudades marcando la default", async () => {
    const console = captureConsole();
    const store = makeStore();
    mockFetch(async () => jsonResponse(currentPayload()));

    expect(await showAllWeather(store)).toBe("continue");
    expect(console.logText).toContain("Ottawa, Ontario, Canadá");
    expect(console.logText).toContain("Barcelona, Cataluña, España");
    expect(console.logs.filter((line) => line.includes("Temperatura"))).toHaveLength(2);
  });

  test("un fallo en una ciudad no corta el resto del listado", async () => {
    const console = captureConsole();
    const store = makeStore();
    mockFetch(async (url) => {
      if (url.includes(String(OTTAWA.latitude))) return new Response("boom", { status: 500 });
      return jsonResponse(currentPayload(20.5));
    });

    expect(await showAllWeather(store)).toBe("continue");
    expect(console.errorText).toContain("Ottawa, Ontario, Canadá");
    expect(console.errorText).toContain("500");
    expect(console.logText).toContain("Barcelona, Cataluña, España");
    expect(console.logText).toContain("Temperatura: 20.5 °C");
  });
});
