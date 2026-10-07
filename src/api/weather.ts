import type { City } from "../types/City.ts";
import type { CurrentWeather, DailyForecast, Forecast, Unit } from "../types/Weather.ts";
import { FORECAST_URL } from "../utils/constants.ts";
import { asNumber, asString, isRecord } from "../utils/guards.ts";
import { fetchJson, WeatherError } from "./client.ts";

export function parseForecastResponse(payload: unknown): CurrentWeather {
  if (!isRecord(payload) || !isRecord(payload.current)) {
    throw new WeatherError("La API del clima devolvió una respuesta con un formato desconocido.");
  }

  const current = payload.current;
  const temperature = asNumber(current.temperature_2m);
  if (temperature === null) {
    throw new WeatherError("La API del clima no devolvió la temperatura actual.");
  }

  const units = payload.current_units;
  return {
    temperature,
    unit: (isRecord(units) ? asString(units.temperature_2m) : null) ?? "°",
    time: asString(current.time) ?? "",
  };
}

export function parseDailyForecastResponse(payload: unknown): Forecast {
  if (!isRecord(payload) || !isRecord(payload.daily)) {
    throw new WeatherError("La API del clima devolvió una respuesta con un formato desconocido.");
  }

  const daily = payload.daily;
  const dates = daily.time;
  if (!Array.isArray(dates)) {
    throw new WeatherError("La API del clima devolvió una respuesta con un formato desconocido.");
  }

  const maxima = asArray(daily.temperature_2m_max);
  const minima = asArray(daily.temperature_2m_min);
  if (maxima === null || minima === null) {
    throw new WeatherError("La API del clima no devolvió las temperaturas del pronóstico.");
  }

  const precipitation = asArray(daily.precipitation_probability_max);
  const codes = asArray(daily.weathercode);

  const days: DailyForecast[] = [];
  for (let index = 0; index < dates.length; index++) {
    const date = asString(dates[index]);
    const tempMax = asNumber(maxima[index]);
    const tempMin = asNumber(minima[index]);
    if (date === null || tempMax === null || tempMin === null) continue;

    days.push({
      date,
      tempMax,
      tempMin,
      precipitationProbability: asNumber(precipitation?.[index]),
      weatherCode: asNumber(codes?.[index]),
    });
  }

  if (days.length === 0) {
    throw new WeatherError("La API del clima no devolvió días válidos en el pronóstico.");
  }

  const units = payload.daily_units;
  return {
    unit: (isRecord(units) ? asString(units.temperature_2m_max) : null) ?? "°",
    days,
  };
}

export async function fetchCurrentWeather(city: City, unit: Unit): Promise<CurrentWeather> {
  const query = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m",
    temperature_unit: unit,
  });
  const payload = await fetchJson(`${FORECAST_URL}?${query}`, "el clima");
  return parseForecastResponse(payload);
}

export async function fetchDailyForecast(city: City, unit: Unit): Promise<Forecast> {
  const query = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
    temperature_unit: unit,
    forecast_days: "7",
  });
  const payload = await fetchJson(`${FORECAST_URL}?${query}`, "el pronóstico");
  return parseDailyForecastResponse(payload);
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}
