import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { WeatherError } from "../../src/api/client.ts";
import type { City } from "../../src/types/City.ts";
import { cityLabel, formatError, formatTimestamp, unitLabel, unitSymbol, weekdayLabel } from "../../src/utils/format.ts";

const OTTAWA: City = {
  id: 6094817,
  name: "Ottawa",
  country: "Canadá",
  region: "Ontario",
  latitude: 45.41117,
  longitude: -75.69812,
};

afterEach(() => {
  mock.restore();
});

describe("cityLabel", () => {
  test("une nombre, región y país con coma y espacio", () => {
    expect(cityLabel(OTTAWA)).toBe("Ottawa, Ontario, Canadá");
  });

  test("omite la región cuando es null", () => {
    expect(cityLabel({ ...OTTAWA, region: null })).toBe("Ottawa, Canadá");
  });
});

describe("unitLabel / unitSymbol", () => {
  test("describe cada unidad con nombre completo y símbolo", () => {
    expect(unitLabel("celsius")).toBe("Celsius (°C)");
    expect(unitLabel("fahrenheit")).toBe("Fahrenheit (°F)");
    expect(unitSymbol("celsius")).toBe("°C");
    expect(unitSymbol("fahrenheit")).toBe("°F");
  });
});

describe("weekdayLabel", () => {
  test("devuelve el día de la semana en español (UTC)", () => {
    expect(weekdayLabel("2026-10-06")).toBe("mar");
    expect(weekdayLabel("2026-10-11")).toBe("dom");
    expect(weekdayLabel("2026-10-12")).toBe("lun");
  });

  test("devuelve vacío ante una fecha inválida", () => {
    expect(weekdayLabel("no-es-fecha")).toBe("");
    expect(weekdayLabel("")).toBe("");
  });
});

describe("formatTimestamp", () => {
  test("convierte ISO a 'DD/MM/YYYY HH:MM'", () => {
    expect(formatTimestamp("2026-10-05T16:45")).toBe("05/10/2026 16:45");
  });

  test("sin hora devuelve solo la fecha", () => {
    expect(formatTimestamp("2026-01-31")).toBe("31/01/2026");
  });
});

describe("formatError", () => {
  test("usa el mensaje de WeatherError sin loguear el error", () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});

    expect(formatError(new WeatherError("Open-Meteo respondió con error 500."))).toBe(
      "Open-Meteo respondió con error 500.",
    );
    expect(spy).not.toHaveBeenCalled();
  });

  test("loguea errores inesperados y devuelve un mensaje genérico", () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("boom");

    expect(formatError(boom)).toBe("Ocurrió un error inesperado. Intentá de nuevo.");
    expect(spy).toHaveBeenCalledWith(boom);
  });

  test("también acepta valores no-Error", () => {
    spyOn(console, "error").mockImplementation(() => {});

    expect(formatError("cadena rota")).toBe("Ocurrió un error inesperado. Intentá de nuevo.");
  });
});
