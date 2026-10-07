import type { City } from "../types/City.ts";
import type { CurrentWeather, Forecast } from "../types/Weather.ts";
import { paint } from "../utils/colors.ts";
import { cityLabel, formatTimestamp, weekdayLabel } from "../utils/format.ts";
import { weatherCodeLabel } from "../utils/weatherCodes.ts";

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
