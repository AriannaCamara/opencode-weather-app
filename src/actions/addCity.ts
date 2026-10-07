import { searchCityByName } from "../api/geocoding.ts";
import type { Input } from "../presentation/input.ts";
import { error, info, success, warn } from "../presentation/output.ts";
import type { City } from "../types/City.ts";
import type { MenuOutcome } from "../types/MenuOption.ts";
import type { Store } from "../types/Store.ts";
import { addCity, findCityById } from "../storage/citiesStorage.ts";
import { cityLabel } from "../utils/format.ts";

export async function askForNewCity(store: Store, input: Input): Promise<City | null> {
  const answer = await input.ask("  Nombre de la ciudad: ");
  const name = answer?.trim() ?? "";
  if (name === "") return null;

  const city = await searchCityByName(name);
  if (!city) {
    error(`No se encontró ninguna ciudad llamada "${name}".`);
    return null;
  }

  const existing = findCityById(store, city.id);
  if (existing) {
    warn(`"${cityLabel(existing)}" ya está en tu lista.`);
    return existing;
  }

  addCity(store, city);
  success(`Ciudad agregada: ${cityLabel(city)}`);
  if (store.cities.length === 1) info("Es tu única ciudad, quedó como default.");
  return city;
}

export async function addCityFlow(store: Store, input: Input): Promise<MenuOutcome> {
  await askForNewCity(store, input);
  return "continue";
}
