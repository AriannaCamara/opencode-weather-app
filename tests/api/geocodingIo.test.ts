import { afterEach, describe, expect, mock, test } from "bun:test";
import { jsonResponse, mockFetch } from "../helpers.ts";
import { searchCityByName } from "../../src/api/geocoding.ts";
import { GEOCODING_URL } from "../../src/utils/constants.ts";

const OTTAWA_PAYLOAD = {
  results: [
    {
      id: 6094817,
      name: "Ottawa",
      latitude: 45.41117,
      longitude: -75.69812,
      country: "Canadá",
      admin1: "Ontario",
    },
  ],
};

afterEach(() => {
  mock.restore();
});

describe("searchCityByName", () => {
  test("consulta el endpoint de geocoding con count=1 y language=es", async () => {
    const spy = mockFetch(async () => jsonResponse(OTTAWA_PAYLOAD));

    await searchCityByName("Ottawa");

    expect(spy).toHaveBeenCalledTimes(1);
    const url = new URL(String(spy.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe(GEOCODING_URL);
    expect(url.searchParams.get("name")).toBe("Ottawa");
    expect(url.searchParams.get("count")).toBe("1");
    expect(url.searchParams.get("language")).toBe("es");
    expect(url.searchParams.get("format")).toBe("json");
  });

  test("devuelve la ciudad parseada", async () => {
    mockFetch(async () => jsonResponse(OTTAWA_PAYLOAD));

    expect(await searchCityByName("Ottawa")).toEqual({
      id: 6094817,
      name: "Ottawa",
      country: "Canadá",
      region: "Ontario",
      latitude: 45.41117,
      longitude: -75.69812,
    });
  });

  test("devuelve null cuando la API no encuentra la ciudad", async () => {
    mockFetch(async () => jsonResponse({ generationtime_ms: 1 }));

    expect(await searchCityByName("Narnia")).toBeNull();
  });

  test("propaga WeatherError si la red falla", async () => {
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(searchCityByName("Ottawa")).rejects.toThrow(/No se pudo consultar/);
  });
});
