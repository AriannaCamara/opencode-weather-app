import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createDefaultStore } from "./cities.ts";
import { asNumber, asString, isRecord } from "./guards.ts";
import type { City, Store } from "./types.ts";

const DEFAULT_STORE_PATH = "data/cities.json";

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