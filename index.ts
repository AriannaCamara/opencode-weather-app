#!/usr/bin/env bun
import { fetchCurrentWeather, searchCityByName, WeatherError } from "./src/api.ts";
import { addCity, findCityById, removeCity, setDefaultCity, toggleUnit } from "./src/cities.ts";
import { loadStore, saveStore } from "./src/store.ts";
import { createInput } from "./src/input.ts";
import type { Input } from "./src/input.ts";
import { cityLabel, error, info, renderCityList, renderMenu, renderWeather, success, unitLabel, warn } from "./src/ui.ts";
import type { City, Store } from "./src/types.ts";

type MenuOutcome = "continue" | "exit";

async function main(): Promise<void> {
  const store = await loadStore();
  const input = createInput();

  try {
    await runMenuLoop(store, input);
  } finally {
    input.close();
  }

  await saveStore(store);
}

async function runMenuLoop(store: Store, input: Input): Promise<void> {
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

async function showDefaultWeather(store: Store, input: Input): Promise<MenuOutcome> {
  const city = store.defaultCity ?? (await askForNewCity(store, input));
  if (!city) return "continue";

  const weather = await fetchCurrentWeather(city, store.unit);
  renderWeather(city, weather, store.defaultCity?.id === city.id);
  return "continue";
}

async function showAllWeather(store: Store): Promise<MenuOutcome> {
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

async function addCityFlow(store: Store, input: Input): Promise<MenuOutcome> {
  await askForNewCity(store, input);
  return "continue";
}

async function removeCityFlow(store: Store, input: Input): Promise<MenuOutcome> {
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

async function setDefaultFlow(store: Store, input: Input): Promise<MenuOutcome> {
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

async function settingsFlow(store: Store, input: Input): Promise<MenuOutcome> {
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

async function askForNewCity(store: Store, input: Input): Promise<City | null> {
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

async function pickCityFromList(store: Store, input: Input): Promise<City | null> {
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

function isAffirmative(answer: string): boolean {
  const normalized = answer.trim().toLowerCase();
  return normalized === "s" || normalized === "si" || normalized === "sí";
}

function formatError(error: unknown): string {
  if (error instanceof WeatherError) return error.message;
  console.error(error);
  return "Ocurrió un error inesperado. Intentá de nuevo.";
}

await main();