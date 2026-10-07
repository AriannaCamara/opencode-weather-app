import type { City } from "../types/City.ts";
import { GEOCODING_URL } from "../utils/constants.ts";
import { asNumber, asString, isRecord } from "../utils/guards.ts";
import { fetchJson } from "./client.ts";

export function parseGeocodingResponse(payload: unknown): City | null {
  if (!isRecord(payload) || !Array.isArray(payload.results)) return null;

  for (const result of payload.results) {
    const city = toCity(result);
    if (city) return city;
  }
  return null;
}

export async function searchCityByName(name: string): Promise<City | null> {
  const query = new URLSearchParams({ name, count: "1", language: "es", format: "json" });
  const payload = await fetchJson(`${GEOCODING_URL}?${query}`, "las coordenadas de la ciudad");
  return parseGeocodingResponse(payload);
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
