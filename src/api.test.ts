import { describe, expect, test } from "bun:test";
import { parseForecastResponse, parseGeocodingResponse, WeatherError } from "./api.ts";

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

// Fixture copiado de https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
const FORECAST_OK = {
  latitude: 45.406376,
  longitude: -75.71817,
  timezone: "GMT",
  current_units: { time: "iso8601", interval: "seconds", temperature_2m: "°C" },
  current: { time: "2026-10-05T16:45", interval: 900, temperature_2m: 10.8 },
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

describe("parseForecastResponse", () => {
  test("extrae temperatura, símbolo y hora", () => {
    expect(parseForecastResponse(FORECAST_OK)).toEqual({
      temperature: 10.8,
      unit: "°C",
      time: "2026-10-05T16:45",
    });
  });

  test("respeta el símbolo que devuelve la API", () => {
    const payload = {
      ...FORECAST_OK,
      current_units: { temperature_2m: "°F" },
    };

    expect(parseForecastResponse(payload).unit).toBe("°F");
  });

  test("cae a '°' si la API no manda current_units", () => {
    const payload = { ...FORECAST_OK, current_units: undefined };

    expect(parseForecastResponse(payload).unit).toBe("°");
  });

  test("lanza WeatherError si falta current", () => {
    expect(() => parseForecastResponse({ latitude: 1 })).toThrow(WeatherError);
  });

  test("lanza WeatherError si temperature_2m no es numérico", () => {
    const payload = { ...FORECAST_OK, current: { time: "2026-10-05T16:45", temperature_2m: null } };

    expect(() => parseForecastResponse(payload)).toThrow(WeatherError);
  });

  test("tolera una temperatura negativa", () => {
    const payload = { ...FORECAST_OK, current: { time: "2026-01-01T00:00", temperature_2m: -12.3 } };

    expect(parseForecastResponse(payload).temperature).toBe(-12.3);
  });
});