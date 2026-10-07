import { removeCity } from "../storage/citiesStorage.ts";
import type { Input } from "../presentation/input.ts";
import { info, success } from "../presentation/output.ts";
import type { MenuOutcome } from "../types/MenuOption.ts";
import type { Store } from "../types/Store.ts";
import { cityLabel } from "../utils/format.ts";
import { isAffirmative } from "../presentation/input.ts";
import { pickCityFromList } from "./listCities.ts";

export async function removeCityFlow(store: Store, input: Input): Promise<MenuOutcome> {
  const city = await pickCityFromList(store, input);
  if (!city) return "continue";

  const question =
    store.cities.length === 1
      ? `  "${cityLabel(city)}" es tu única ciudad. Confirmá escribiendo "si": `
      : `  ¿Eliminar "${cityLabel(city)}"? (s/n): `;

  const answer = await input.ask(question);
  if (answer === null || !isAffirmative(answer)) {
    info("Operación cancelada.");
    return "continue";
  }

  const removed = removeCity(store, city.id);
  if (removed) success(`Ciudad eliminada: ${cityLabel(removed)}`);
  if (store.defaultCity === null) info("Ahora no queda ninguna ciudad guardada.");
  return "continue";
}
