import { describe, expect, test } from "bun:test";
import { WeatherError } from "./client.ts";
import { parseDailyForecastResponse, parseForecastResponse } from "./weather.ts";

// Fixture copiado de https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
const FORECAST_OK = {
  latitude: 45.406376,
  longitude: -75.71817,
  timezone: "GMT",
  current_units: { time: "iso8601", interval: "seconds", temperature_2m: "°C" },
  current: { time: "2026-10-05T16:45", interval: 900, temperature_2m: 10.8 },
};

// Fixture construido a partir de https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&forecast_days=7
const DAILY_FORECAST_OK = {
  latitude: 45.406376,
  daily_units: {
    time: "iso8601",
    temperature_2m_max: "°C",
    temperature_2m_min: "°C",
    precipitation_probability_max: "%",
    weathercode: "wmo code",
  },
  daily: {
    time: ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"],
    temperature_2m_max: [21.4, 19.2, 17.8, 18.5, 20.1, 22.3, 23],
    temperature_2m_min: [12.1, 10.4, 9.7, 8.9, 11.2, 12.5, 13.4],
    precipitation_probability_max: [30, 60, null, 10, 0, 5, 20],
    weathercode: [1, 61, 3, 45, 0, 2, 95],
  },
};

describe("parseForecastResponse", () => {
  test("extrae temperatura, símbolo y hora", () => {
    expect(parseForecastResponse(FORECAST_OK)).toEqual({
      temperature: 10.8,
      unit: "°C",
      time: "2026-10-05T16:45",
    });
  });

  test("respeta el símbolo que devuelve la API", () => {
    const payload = {
      ...FORECAST_OK,
      current_units: { temperature_2m: "°F" },
    };

    expect(parseForecastResponse(payload).unit).toBe("°F");
  });

  test("cae a '°' si la API no manda current_units", () => {
    const payload = { ...FORECAST_OK, current_units: undefined };

    expect(parseForecastResponse(payload).unit).toBe("°");
  });

  test("lanza WeatherError si falta current", () => {
    expect(() => parseForecastResponse({ latitude: 1 })).toThrow(WeatherError);
  });

  test("lanza WeatherError si temperature_2m no es numérico", () => {
    const payload = { ...FORECAST_OK, current: { time: "2026-10-05T16:45", temperature_2m: null } };

    expect(() => parseForecastResponse(payload)).toThrow(WeatherError);
  });

  test("tolera una temperatura negativa", () => {
    const payload = { ...FORECAST_OK, current: { time: "2026-01-01T00:00", temperature_2m: -12.3 } };

    expect(parseForecastResponse(payload).temperature).toBe(-12.3);
  });
});

describe("parseDailyForecastResponse", () => {
  test("mapea los 7 días con temperaturas, clima y precipitación", () => {
    const forecast = parseDailyForecastResponse(DAILY_FORECAST_OK);

    expect(forecast.unit).toBe("°C");
    expect(forecast.days).toHaveLength(7);
    expect(forecast.days[0]).toEqual({
      date: "2026-10-06",
      tempMax: 21.4,
      tempMin: 12.1,
      precipitationProbability: 30,
      weatherCode: 1,
    });
  });

  test("deja precipitación y clima en null cuando la API no los manda", () => {
    const payload = {
      daily: {
        time: ["2026-10-06"],
        temperature_2m_max: [21.4],
        temperature_2m_min: [12.1],
      },
    };

    expect(parseDailyForecastResponse(payload).days[0]).toEqual({
      date: "2026-10-06",
      tempMax: 21.4,
      tempMin: 12.1,
      precipitationProbability: null,
      weatherCode: null,
    });
  });

  test("saltea los días con datos incompletos", () => {
    const payload = {
      daily: {
        time: ["2026-10-06", "2026-10-07", "2026-10-08"],
        temperature_2m_max: [21.4, null, 17.8],
        temperature_2m_min: [12.1, 10.4, 9.7],
      },
    };

    const forecast = parseDailyForecastResponse(payload);
    expect(forecast.days).toHaveLength(2);
    expect(forecast.days.map((day) => day.date)).toEqual(["2026-10-06", "2026-10-08"]);
  });

  test("cae a '°' si la API no manda daily_units", () => {
    const payload = { daily: DAILY_FORECAST_OK.daily };

    expect(parseDailyForecastResponse(payload).unit).toBe("°");
  });

  test("lanza WeatherError si falta daily.time", () => {
    expect(() => parseDailyForecastResponse({ latitude: 1 })).toThrow(WeatherError);
    expect(() => parseDailyForecastResponse({ daily: { temperature_2m_max: [] } })).toThrow(WeatherError);
  });

  test("lanza WeatherError si faltan las temperaturas", () => {
    const payload = { daily: { time: ["2026-10-06"], temperature_2m_min: [12.1] } };

    expect(() => parseDailyForecastResponse(payload)).toThrow(WeatherError);
  });

  test("lanza WeatherError si ningún día es válido", () => {
    const payload = { daily: { time: ["2026-10-06"], temperature_2m_max: [null], temperature_2m_min: [null] } };

    expect(() => parseDailyForecastResponse(payload)).toThrow(WeatherError);
  });
});
