import { addCityFlow } from "../actions/addCity.ts";
import { showForecastFlow } from "../actions/forecast.ts";
import { showAllWeather, showDefaultWeather } from "../actions/getWeather.ts";
import { removeCityFlow } from "../actions/removeCity.ts";
import { setDefaultFlow } from "../actions/setDefaultCity.ts";
import { settingsFlow } from "../actions/settings.ts";
import type { Input } from "./input.ts";
import { error, info } from "./output.ts";
import type { MenuOutcome } from "../types/MenuOption.ts";
import type { Store } from "../types/Store.ts";
import { paint } from "../utils/colors.ts";
import { BOX_WIDTH, MENU_TITLE } from "../utils/constants.ts";
import { formatError, unitSymbol } from "../utils/format.ts";

const BOX_LINE = "═".repeat(BOX_WIDTH);

export function renderMenu(store: Store): void {
  const line = paint(BOX_LINE, "cyan");
  const padding = " ".repeat(Math.floor((BOX_WIDTH - MENU_TITLE.length) / 2));

  console.log(`
${line}
${padding}${paint(MENU_TITLE, "bold", "cyan")}
${line}
${menuOption("1", "Clima de ciudad default")}
${menuOption("2", `Clima de todas las ciudades (${store.cities.length})`)}
${menuOption("3", "Buscar y agregar ciudad")}
${menuOption("4", "Eliminar ciudad")}
${menuOption("5", "Establecer ciudad default")}
${menuOption("6", "Pronóstico 7 días")}
${menuOption("8", `Ajustes (${paint(unitSymbol(store.unit), "yellow")})`)}
${menuOption("9", "Salir")}
${line}`);
}

export async function runMenuLoop(store: Store, input: Input): Promise<void> {
  for (;;) {
    renderMenu(store);
    const choice = await input.ask("  Selecciona una opción: ");

    if (choice === null) {
      info("\nSaliendo...");
      return;
    }

    if ((await dispatch(choice.trim(), store, input)) === "exit") {
      info("\n¡Hasta luego!");
      return;
    }
  }
}

async function dispatch(raw: string, store: Store, input: Input): Promise<MenuOutcome> {
  if (raw === "") return "continue";

  try {
    switch (raw) {
      case "1":
        return await showDefaultWeather(store, input);
      case "2":
        return await showAllWeather(store);
      case "3":
        return await addCityFlow(store, input);
      case "4":
        return await removeCityFlow(store, input);
      case "5":
        return await setDefaultFlow(store, input);
      case "6":
        return await showForecastFlow(store, input);
      case "8":
        return await settingsFlow(store, input);
      case "9":
        return "exit";
      default:
        error(`Opción inválida: "${raw}".`);
        return "continue";
    }
  } catch (caught) {
    error(formatError(caught));
    return "continue";
  }
}

function menuOption(number: string, label: string): string {
  return `  ${paint(number, "cyan")}. ${label}`;
}
