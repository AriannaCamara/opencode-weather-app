import { toggleUnit } from "../storage/citiesStorage.ts";
import type { Input } from "../presentation/input.ts";
import { isAffirmative } from "../presentation/input.ts";
import { info, success } from "../presentation/output.ts";
import type { MenuOutcome } from "../types/MenuOption.ts";
import type { Store } from "../types/Store.ts";
import { unitLabel } from "../utils/format.ts";

export async function settingsFlow(store: Store, input: Input): Promise<MenuOutcome> {
  info(`\n  Unidad actual: ${unitLabel(store.unit)}`);
  const next = toggleUnit(store.unit);
  const answer = await input.ask(`  ¿Cambiar a ${unitLabel(next)}? (s/n): `);

  if (answer === null || !isAffirmative(answer)) {
    info("Sin cambios.");
    return "continue";
  }

  store.unit = next;
  success(`Unidad actualizada: ${unitLabel(store.unit)}`);
  return "continue";
}
