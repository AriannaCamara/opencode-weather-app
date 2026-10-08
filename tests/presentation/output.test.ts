import { afterEach, describe, expect, mock, test } from "bun:test";
import { BARCELONA, captureConsole, OTTAWA } from "../helpers.ts";
import type { CurrentWeather, Forecast } from "../../src/types/Weather.ts";
import { error, info, renderCityList, renderForecast, renderWeather, success, warn } from "../../src/presentation/output.ts";

const WEATHER: CurrentWeather = { temperature: 10.8, unit: "°C", time: "2026-10-05T16:45" };

const FORECAST: Forecast = {
  unit: "°C",
  days: [
    { date: "2026-10-06", tempMax: 21.4, tempMin: 12.1, precipitationProbability: 30, weatherCode: 1 },
    { date: "2026-10-07", tempMax: 19.2, tempMin: 10.4, precipitationProbability: null, weatherCode: null },
  ],
};

afterEach(() => {
  mock.restore();
});

describe("renderWeather", () => {
  test("muestra ciudad, temperatura y hora de actualización", () => {
    const console = captureConsole();

    renderWeather(OTTAWA, WEATHER, false);

    expect(console.logText).toContain("Ottawa, Ontario, Canadá");
    expect(console.logText).toContain("Temperatura: 10.8 °C");
    expect(console.logText).toContain("Actualizado: 05/10/2026 16:45");
  });

  test("marca la ciudad default con un ★", () => {
    const plain = captureConsole();
    renderWeather(OTTAWA, WEATHER, true);
    const marked = plain.logText;
    mock.restore();

    const clean = captureConsole();
    renderWeather(OTTAWA, WEATHER, false);

    expect(marked).toContain("★");
    expect(clean.logText).not.toContain("★");
  });

  test("omite la hora cuando el tiempo viene vacío", () => {
    const console = captureConsole();

    renderWeather(OTTAWA, { ...WEATHER, time: "" }, false);

    expect(console.logText).not.toContain("Actualizado:");
    expect(console.logText).toContain("Temperatura:");
  });
});

describe("renderForecast", () => {
  test("imprime el encabezado y una fila por día", () => {
    const console = captureConsole();

    renderForecast(OTTAWA, FORECAST, false);

    expect(console.logText).toContain("Pronóstico 7 días");
    expect(console.logText).toContain("(°C)");
    const rows = console.logs.filter((line) => line.includes("12.1"));
    expect(rows).toHaveLength(1);
    expect(console.logText).toContain("06/10");
    expect(console.logText).toContain("30%");
  });

  test("omite el porcentaje de lluvia cuando no hay dato", () => {
    const console = captureConsole();

    renderForecast(OTTAWA, FORECAST, false);

    expect(console.logText).not.toContain("null");
    const withoutRain = console.logs.filter((line) => line.includes("10.4"));
    expect(withoutRain[0]).toBeDefined();
    expect(withoutRain[0]).not.toContain("%");
  });

  test("describe el clima con el código WMO", () => {
    const console = captureConsole();

    renderForecast(OTTAWA, FORECAST, false);

    expect(console.logText).toContain("Mayormente despejado");
    expect(console.logText).toContain("Sin datos");
  });
});

describe("renderCityList", () => {
  test("numerá las ciudades y marca la default", () => {
    const console = captureConsole();

    renderCityList([OTTAWA, BARCELONA], BARCELONA.id);

    const text = console.logText;
    expect(text).toContain("Ciudades guardadas:");
    expect(text).toContain("1. Ottawa, Ontario, Canadá");
    expect(text).toContain("2. Barcelona, Cataluña, España");
    expect(text).toContain("★ default");
  });

  test("sin default no aparece la estrella", () => {
    const console = captureConsole();

    renderCityList([OTTAWA], null);

    expect(console.logText).not.toContain("★");
  });
});

describe("mensajes de estado", () => {
  test("success, warn e info van a stdout y error a stderr", () => {
    const console = captureConsole();

    success("ok");
    warn("cuidado");
    info("dato");
    error("fallo");

    expect(console.logText).toContain("ok");
    expect(console.logText).toContain("cuidado");
    expect(console.logText).toContain("dato");
    expect(console.logText).not.toContain("fallo");
    expect(console.errorText).toContain("fallo");
  });
});
