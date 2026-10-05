import type { City, CurrentWeather, Store, Unit } from "./types.ts";

const BOX_WIDTH = 40;
const BOX_LINE = "═".repeat(BOX_WIDTH);

export function renderMenu(store: Store): void {
  console.log(`
${BOX_LINE}
${" ".repeat(Math.floor((BOX_WIDTH - "WEATHER CLI".length) / 2))}WEATHER CLI
${BOX_LINE}
  1. Clima de ciudad default
  2. Clima de todas las ciudades (${store.cities.length})
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  8. Ajustes (${unitSymbol(store.unit)})
  9. Salir
${BOX_LINE}`);
}

export function renderWeather(city: City, weather: CurrentWeather, isDefault: boolean): void {
  console.log(`  ${cityLabel(city)}${isDefault ? " ★" : ""}`);
  console.log(`    Temperatura: ${weather.temperature} ${weather.unit}`);
  if (weather.time !== "") {
    console.log(`    Actualizado: ${formatTimestamp(weather.time)}`);
  }
  console.log("");
}

export function renderCityList(cities: City[], defaultCityId: number | null): void {
  console.log("\n  Ciudades guardadas:");
  cities.forEach((city, index) => {
    const marker = city.id === defaultCityId ? " ★ default" : "";
    console.log(`    ${index + 1}. ${cityLabel(city)}${marker}`);
  });
  console.log("");
}

export function cityLabel(city: City): string {
  return [city.name, city.region, city.country].filter((part) => part !== null).join(", ");
}

export function unitLabel(unit: Unit): string {
  return unit === "celsius" ? "Celsius (°C)" : "Fahrenheit (°F)";
}

function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

function formatTimestamp(iso: string): string {
  const [date = "", time = ""] = iso.split("T");
  const day = date.split("-").reverse().join("/");
  const shortTime = time.slice(0, 5);
  return `${day} ${shortTime}`.trim();
}