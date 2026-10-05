import { asNumber, asString, isRecord } from "./guards.ts";
import type { City, CurrentWeather, Unit } from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export class WeatherError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WeatherError";
  }
}

export function parseGeocodingResponse(payload: unknown): City | null {
  if (!isRecord(payload) || !Array.isArray(payload.results)) return null;

  for (const result of payload.results) {
    const city = toCity(result);
    if (city) return city;
  }
  return null;
}

export function parseForecastResponse(payload: unknown): CurrentWeather {
  if (!isRecord(payload) || !isRecord(payload.current)) {
    throw new WeatherError("La API del clima devolvió una respuesta con un formato desconocido.");
  }

  const current = payload.current;
  const temperature = asNumber(current.temperature_2m);
  if (temperature === null) {
    throw new WeatherError("La API del clima no devolvió la temperatura actual.");
  }

  const units = payload.current_units;
  return {
    temperature,
    unit: (isRecord(units) ? asString(units.temperature_2m) : null) ?? "°",
    time: asString(current.time) ?? "",
  };
}

export async function searchCityByName(name: string): Promise<City | null> {
  const query = new URLSearchParams({ name, count: "1", language: "es", format: "json" });
  const payload = await fetchJson(`${GEOCODING_URL}?${query}`, "las coordenadas de la ciudad");
  return parseGeocodingResponse(payload);
}

export async function fetchCurrentWeather(city: City, unit: Unit): Promise<CurrentWeather> {
  const query = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m",
    temperature_unit: unit,
  });
  const payload = await fetchJson(`${FORECAST_URL}?${query}`, "el clima");
  return parseForecastResponse(payload);
}

async function fetchJson(url: string, subject: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new WeatherError(`No se pudo consultar ${subject}. Revisá tu conexión a internet.`, { cause: error });
  }

  if (!response.ok) {
    throw new WeatherError(`Open-Meteo respondió con error ${response.status} al consultar ${subject}.`);
  }

  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new WeatherError(`La respuesta de ${subject} no es un JSON válido.`, { cause: error });
  }
}

function toCity(value: unknown): City | null {
  if (!isRecord(value)) return null;

  const id = asNumber(value.id);
  const name = asString(value.name);
  const latitude = asNumber(value.latitude);
  const longitude = asNumber(value.longitude);
  if (id === null || name === null || latitude === null || longitude === null) return null;

  return {
    id,
    name,
    country: asString(value.country) ?? "País desconocido",
    region: asString(value.admin1),
    latitude,
    longitude,
  };
}