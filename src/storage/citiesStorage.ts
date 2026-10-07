import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { City } from "../types/City.ts";
import type { Store } from "../types/Store.ts";
import type { Unit } from "../types/Weather.ts";
import { DEFAULT_STORE_PATH } from "../utils/constants.ts";
import { asNumber, asString, isRecord } from "../utils/guards.ts";

export function createDefaultStore(): Store {
  return { defaultCity: null, cities: [], unit: "celsius" };
}

export function findCityById(store: Store, id: number): City | null {
  return store.cities.find((city) => city.id === id) ?? null;
}

export function addCity(store: Store, city: City): City {
  const existing = findCityById(store, city.id);
  if (existing) return existing;

  store.cities.push(city);
  store.defaultCity ??= city;
  return city;
}

export function removeCity(store: Store, id: number): City | null {
  const index = store.cities.findIndex((city) => city.id === id);
  const removed = index === -1 ? null : (store.cities[index] ?? null);
  if (removed === null) return null;

  store.cities.splice(index, 1);
  if (store.defaultCity?.id === id) {
    store.defaultCity = store.cities[0] ?? null;
  }
  return removed;
}

export function setDefaultCity(store: Store, id: number): City | null {
  const city = findCityById(store, id);
  if (!city) return null;

  store.defaultCity = city;
  return city;
}

export function toggleUnit(unit: Unit): Unit {
  return unit === "celsius" ? "fahrenheit" : "celsius";
}

export async function loadStore(path: string = DEFAULT_STORE_PATH): Promise<Store> {
  const fallback = createDefaultStore();
  const file = Bun.file(path);
  if (!(await file.exists())) return fallback;

  try {
    const raw: unknown = await file.json();
    return normalizeStore(raw) ?? fallback;
  } catch {
    console.warn(`No se pudo leer "${path}"; se usan los valores por defecto.`);
    return fallback;
  }
}

export async function saveStore(store: Store, path: string = DEFAULT_STORE_PATH): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${JSON.stringify(store, null, 2)}\n`);
}

export function normalizeStore(value: unknown): Store | null {
  if (!isRecord(value) || !Array.isArray(value.cities)) return null;

  const cities = value.cities.map(normalizeCity).filter((city) => city !== null);
  const requestedDefault = normalizeCity(value.defaultCity);
  const defaultCity = cities.find((city) => city.id === requestedDefault?.id) ?? cities[0] ?? null;

  return {
    cities,
    unit: value.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    defaultCity,
  };
}

function normalizeCity(value: unknown): City | null {
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
    region: asString(value.region),
    latitude,
    longitude,
  };
}
