import { WeatherError } from "../api/client.ts";
import type { City } from "../types/City.ts";
import type { Unit } from "../types/Weather.ts";

export function cityLabel(city: City): string {
  return [city.name, city.region, city.country].filter((part) => part !== null).join(", ");
}

export function unitLabel(unit: Unit): string {
  return unit === "celsius" ? "Celsius (°C)" : "Fahrenheit (°F)";
}

export function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

// Día de la semana en español sin depender del locale del sistema.
export function weekdayLabel(date: string): string {
  const weekdays = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  return weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? "";
}

export function formatTimestamp(iso: string): string {
  const [date = "", time = ""] = iso.split("T");
  const day = date.split("-").reverse().join("/");
  const shortTime = time.slice(0, 5);
  return `${day} ${shortTime}`.trim();
}

export function formatError(caught: unknown): string {
  if (caught instanceof WeatherError) return caught.message;
  console.error(caught);
  return "Ocurrió un error inesperado. Intentá de nuevo.";
}
