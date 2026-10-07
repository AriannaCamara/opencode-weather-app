import type { Input } from "../presentation/input.ts";
import { error, renderCityList, warn } from "../presentation/output.ts";
import type { City } from "../types/City.ts";
import type { Store } from "../types/Store.ts";

export async function pickCityFromList(store: Store, input: Input): Promise<City | null> {
  if (store.cities.length === 0) {
    warn("\nNo tenés ciudades guardadas. Usá la opción 3 para agregar una.");
    return null;
  }

  renderCityList(store.cities, store.defaultCity?.id ?? null);
  const answer = await input.ask("  Número de ciudad: ");
  const index = Number(answer?.trim()) - 1;
  const city = Number.isInteger(index) ? (store.cities[index] ?? null) : null;

  if (!city) {
    error("Número de ciudad inválido.");
    return null;
  }
  return city;
}
