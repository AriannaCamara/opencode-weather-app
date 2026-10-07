import { fetchDailyForecast } from "../api/weather.ts";
import type { Input } from "../presentation/input.ts";
import { renderForecast } from "../presentation/output.ts";
import type { MenuOutcome } from "../types/MenuOption.ts";
import type { Store } from "../types/Store.ts";
import { askForNewCity } from "./addCity.ts";

export async function showForecastFlow(store: Store, input: Input): Promise<MenuOutcome> {
  const city = store.defaultCity ?? (await askForNewCity(store, input));
  if (!city) return "continue";

  const forecast = await fetchDailyForecast(city, store.unit);
  renderForecast(city, forecast, store.defaultCity?.id === city.id);
  return "continue";
}
