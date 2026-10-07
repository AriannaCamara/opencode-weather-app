import { fetchCurrentWeather } from "../api/weather.ts";
import type { Input } from "../presentation/input.ts";
import { error, renderWeather, warn } from "../presentation/output.ts";
import type { MenuOutcome } from "../types/MenuOption.ts";
import type { Store } from "../types/Store.ts";
import { askForNewCity } from "./addCity.ts";
import { cityLabel, formatError } from "../utils/format.ts";

export async function showDefaultWeather(store: Store, input: Input): Promise<MenuOutcome> {
  const city = store.defaultCity ?? (await askForNewCity(store, input));
  if (!city) return "continue";

  const weather = await fetchCurrentWeather(city, store.unit);
  renderWeather(city, weather, store.defaultCity?.id === city.id);
  return "continue";
}

export async function showAllWeather(store: Store): Promise<MenuOutcome> {
  if (store.cities.length === 0) {
    warn("\nNo tenés ciudades guardadas. Usá la opción 3 para agregar una.");
    return "continue";
  }

  for (const city of store.cities) {
    try {
      const weather = await fetchCurrentWeather(city, store.unit);
      renderWeather(city, weather, store.defaultCity?.id === city.id);
    } catch (caught) {
      error(`  ${cityLabel(city)}: ${formatError(caught)}`);
    }
  }
  return "continue";
}
