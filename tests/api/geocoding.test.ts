import { describe, expect, test } from "bun:test";
import { parseGeocodingResponse } from "../../src/api/geocoding.ts";

// Fixture copiado de https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es
const GEOCODING_OK = {
  results: [
    {
      id: 6094817,
      name: "Ottawa",
      latitude: 45.41117,
      longitude: -75.69812,
      country: "Canadá",
      admin1: "Ontario",
      admin2: "Ottawa",
      timezone: "America/Toronto",
      population: 1017449,
    },
  ],
  generationtime_ms: 0.6762743,
};

describe("parseGeocodingResponse", () => {
  test("mapea el resultado de GeoNames a una City", () => {
    expect(parseGeocodingResponse(GEOCODING_OK)).toEqual({
      id: 6094817,
      name: "Ottawa",
      country: "Canadá",
      region: "Ontario",
      latitude: 45.41117,
      longitude: -75.69812,
    });
  });

  test("devuelve null cuando la API no encuentra la ciudad", () => {
    expect(parseGeocodingResponse({ generationtime_ms: 0.5 })).toBeNull();
  });

  test("devuelve null si results viene vacío", () => {
    expect(parseGeocodingResponse({ results: [] })).toBeNull();
  });

  test("saltea resultados incompletos y usa el primero válido", () => {
    const payload = { results: [{ name: "Sin coordenadas" }, GEOCODING_OK.results[0]] };

    expect(parseGeocodingResponse(payload)?.name).toBe("Ottawa");
  });

  test("devuelve null cuando el payload no es un objeto", () => {
    expect(parseGeocodingResponse(null)).toBeNull();
    expect(parseGeocodingResponse("basura")).toBeNull();
  });

  test("usa 'País desconocido' si falta el país y null si falta la región", () => {
    const payload = { results: [{ id: 1, name: "X", latitude: 1, longitude: 2 }] };

    expect(parseGeocodingResponse(payload)).toEqual({
      id: 1,
      name: "X",
      country: "País desconocido",
      region: null,
      latitude: 1,
      longitude: 2,
    });
  });
});
