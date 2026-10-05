import type { City, Store, Unit } from "./types.ts";

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