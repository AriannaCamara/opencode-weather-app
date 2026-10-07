import { setDefaultCity } from "../storage/citiesStorage.ts";
import type { Input } from "../presentation/input.ts";
import { info, success } from "../presentation/output.ts";
import type { MenuOutcome } from "../types/MenuOption.ts";
import type { Store } from "../types/Store.ts";
import { cityLabel } from "../utils/format.ts";
import { pickCityFromList } from "./listCities.ts";

export async function setDefaultFlow(store: Store, input: Input): Promise<MenuOutcome> {
  const city = await pickCityFromList(store, input);
  if (!city) return "continue";

  if (store.defaultCity?.id === city.id) {
    info(`"${cityLabel(city)}" ya es la ciudad default.`);
    return "continue";
  }

  setDefaultCity(store, city.id);
  success(`Ciudad default: ${cityLabel(city)}`);
  return "continue";
}
