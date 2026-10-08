import { afterEach, describe, expect, mock, test } from "bun:test";
import { captureConsole, dailyPayload, fakeInput, jsonResponse, mockFetch, OTTAWA } from "../helpers.ts";
import { showForecastFlow } from "../../src/actions/forecast.ts";
import { addCity, createDefaultStore } from "../../src/storage/citiesStorage.ts";
import type { Store } from "../../src/types/Store.ts";

function makeStore(): Store {
  const store = createDefaultStore();
  addCity(store, OTTAWA);
  return store;
}

afterEach(() => {
  mock.restore();
});

describe("showForecastFlow", () => {
  test("renderiza el pronóstico de 7 días de la ciudad default", async () => {
    const console = captureConsole();
    const store = makeStore();
    const fetchSpy = mockFetch(async () => jsonResponse(dailyPayload()));

    expect(await showForecastFlow(store, fakeInput())).toBe("continue");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(console.logText).toContain("Pronóstico 7 días");
    expect(console.logText).toContain("06/10");
    expect(console.logText).toContain("★");
    expect(console.logs.filter((line) => line.includes("21.4"))).toHaveLength(7);
  });

  test("usa la unidad configurada en el store", async () => {
    captureConsole();
    const store = makeStore();
    store.unit = "fahrenheit";
    const fetchSpy = mockFetch(async () => jsonResponse(dailyPayload()));

    await showForecastFlow(store, fakeInput());

    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("temperature_unit=fahrenheit");
  });

  test("si no hay default pide una ciudad y no consulta si el nombre está vacío", async () => {
    const console = captureConsole();
    const store = createDefaultStore();
    const fetchSpy = mockFetch(async () => jsonResponse(dailyPayload()));

    expect(await showForecastFlow(store, fakeInput(""))).toBe("continue");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(console.errorText).toBe("");
  });

  test("propaga el error de red para que el menú lo capture", async () => {
    const store = makeStore();
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(showForecastFlow(store, fakeInput())).rejects.toThrow(/conexión a internet/);
  });
});
