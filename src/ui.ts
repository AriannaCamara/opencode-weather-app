import { paint } from "./colors.ts";
import type { City, CurrentWeather, Forecast, Store, Unit } from "./types.ts";
import { weatherCodeLabel } from "./weatherCodes.ts";

const BOX_WIDTH = 40;
const BOX_LINE = "═".repeat(BOX_WIDTH);
const TITLE = "WEATHER CLI";

export function renderMenu(store: Store): void {
  const line = paint(BOX_LINE, "cyan");
  const padding = " ".repeat(Math.floor((BOX_WIDTH - TITLE.length) / 2));

  console.log(`
${line}
${padding}${paint(TITLE, "bold", "cyan")}
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

export function renderWeather(city: City, weather: CurrentWeather, isDefault: boolean): void {
  const star = isDefault ? paint(" ★", "yellow") : "";
  console.log(`  ${paint(cityLabel(city), "cyan")}${star}`);
  console.log(`    Temperatura: ${paint(`${weather.temperature} ${weather.unit}`, "yellow")}`);
  if (weather.time !== "") {
    console.log(`    ${paint("Actualizado:", "dim")} ${formatTimestamp(weather.time)}`);
  }
  console.log("");
}

export function renderForecast(city: City, forecast: Forecast, isDefault: boolean): void {
  const star = isDefault ? paint(" ★", "yellow") : "";
  console.log(`  ${paint(cityLabel(city), "cyan")}${star}`);
  console.log(`    ${paint("Pronóstico 7 días", "cyan")} ${paint(`(${forecast.unit})`, "dim")}`);
  console.log("");

  for (const day of forecast.days) {
    const date = `${day.date.slice(8)}/${day.date.slice(5, 7)}`;
    const label = `${weekdayLabel(day.date)} ${date}`;
    const temps =
      `${paint(`${day.tempMin}${forecast.unit}`, "cyan")} / ` +
      paint(`${day.tempMax}${forecast.unit}`, "yellow");
    const rain =
      day.precipitationProbability === null ? "" : `  ${paint(`${day.precipitationProbability}%`, "dim")}`;

    console.log(
      `    ${paint(label, "bold")}  ${weatherCodeLabel(day.weatherCode).padEnd(26)}  ${temps}${rain}`,
    );
  }
  console.log("");
}

export function renderCityList(cities: City[], defaultCityId: number | null): void {
  console.log(`\n  ${paint("Ciudades guardadas:", "cyan")}`);
  cities.forEach((city, index) => {
    const marker = city.id === defaultCityId ? paint(" ★ default", "yellow") : "";
    console.log(`    ${paint(String(index + 1), "cyan")}. ${cityLabel(city)}${marker}`);
  });
  console.log("");
}

export function success(message: string): void {
  console.log(paint(message, "green"));
}

export function error(message: string): void {
  console.error(paint(message, "red"));
}

export function warn(message: string): void {
  console.log(paint(message, "yellow"));
}

export function info(message: string): void {
  console.log(paint(message, "dim"));
}

export function cityLabel(city: City): string {
  return [city.name, city.region, city.country].filter((part) => part !== null).join(", ");
}

export function unitLabel(unit: Unit): string {
  return unit === "celsius" ? "Celsius (°C)" : "Fahrenheit (°F)";
}

function menuOption(number: string, label: string): string {
  return `  ${paint(number, "cyan")}. ${label}`;
}

function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

// Día de la semana en español sin depender del locale del sistema.
function weekdayLabel(date: string): string {
  const weekdays = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  return weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? "";
}

function formatTimestamp(iso: string): string {
  const [date = "", time = ""] = iso.split("T");
  const day = date.split("-").reverse().join("/");
  const shortTime = time.slice(0, 5);
  return `${day} ${shortTime}`.trim();
}
