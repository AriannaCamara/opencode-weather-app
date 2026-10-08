import { afterEach, describe, expect, mock, test } from "bun:test";
import { jsonResponse, mockFetch, OTTAWA } from "../helpers.ts";
import { fetchCurrentWeather, fetchDailyForecast } from "../../src/api/weather.ts";
import { FORECAST_URL } from "../../src/utils/constants.ts";
import type { Mock } from "bun:test";

const CURRENT_PAYLOAD = {
  current_units: { temperature_2m: "°C" },
  current: { time: "2026-10-05T16:45", temperature_2m: 10.8 },
};

const DAILY_PAYLOAD = {
  daily_units: { temperature_2m_max: "°C" },
  daily: {
    time: ["2026-10-06", "2026-10-07"],
    temperature_2m_max: [21.4, 19.2],
    temperature_2m_min: [12.1, 10.4],
    precipitation_probability_max: [30, 60],
    weathercode: [1, 61],
  },
};

function requestedUrl(spy: Mock<typeof fetch>): URL {
  return new URL(String(spy.mock.calls[0]?.[0]));
}

afterEach(() => {
  mock.restore();
});

describe("fetchCurrentWeather", () => {
  test("arma la URL con latitud, longitud y unidad", async () => {
    const spy = mockFetch(async () => jsonResponse(CURRENT_PAYLOAD));

    await fetchCurrentWeather(OTTAWA, "celsius");

    const url = requestedUrl(spy);
    expect(url.origin + url.pathname).toBe(FORECAST_URL);
    expect(url.searchParams.get("latitude")).toBe("45.41117");
    expect(url.searchParams.get("longitude")).toBe("-75.69812");
    expect(url.searchParams.get("current")).toBe("temperature_2m");
    expect(url.searchParams.get("temperature_unit")).toBe("celsius");
  });

  test("devuelve el clima actual parseado", async () => {
    mockFetch(async () => jsonResponse(CURRENT_PAYLOAD));

    expect(await fetchCurrentWeather(OTTAWA, "celsius")).toEqual({
      temperature: 10.8,
      unit: "°C",
      time: "2026-10-05T16:45",
    });
  });

  test("pide Fahrenheit cuando la unidad lo indica", async () => {
    const spy = mockFetch(async () => jsonResponse(CURRENT_PAYLOAD));

    await fetchCurrentWeather(OTTAWA, "fahrenheit");

    expect(requestedUrl(spy).searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("propaga WeatherError si la API responde mal", async () => {
    mockFetch(async () => new Response("boom", { status: 503 }));

    await expect(fetchCurrentWeather(OTTAWA, "celsius")).rejects.toThrow(/503/);
  });
});

describe("fetchDailyForecast", () => {
  test("arma la URL con daily y forecast_days=7", async () => {
    const spy = mockFetch(async () => jsonResponse(DAILY_PAYLOAD));

    await fetchDailyForecast(OTTAWA, "celsius");

    const url = requestedUrl(spy);
    expect(url.origin + url.pathname).toBe(FORECAST_URL);
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.get("daily")).toBe(
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
    );
    expect(url.searchParams.get("temperature_unit")).toBe("celsius");
  });

  test("devuelve los días del pronóstico parseados", async () => {
    mockFetch(async () => jsonResponse(DAILY_PAYLOAD));

    const forecast = await fetchDailyForecast(OTTAWA, "celsius");

    expect(forecast.unit).toBe("°C");
    expect(forecast.days).toHaveLength(2);
    expect(forecast.days[0]).toEqual({
      date: "2026-10-06",
      tempMax: 21.4,
      tempMin: 12.1,
      precipitationProbability: 30,
      weatherCode: 1,
    });
  });

  test("lanza WeatherError si ningún día es válido", async () => {
    mockFetch(async () =>
      jsonResponse({
        daily: { time: ["2026-10-06"], temperature_2m_max: [null], temperature_2m_min: [null] },
      }),
    );

    await expect(fetchDailyForecast(OTTAWA, "celsius")).rejects.toThrow(/días válidos/);
  });
});
