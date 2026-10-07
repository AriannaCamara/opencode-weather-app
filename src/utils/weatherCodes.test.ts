import { describe, expect, test } from "bun:test";
import { weatherCodeLabel } from "./weatherCodes.ts";

describe("weatherCodeLabel", () => {
  test("describe los códigos WMO conocidos", () => {
    expect(weatherCodeLabel(0)).toBe("Despejado");
    expect(weatherCodeLabel(63)).toBe("Lluvia");
    expect(weatherCodeLabel(95)).toBe("Tormenta");
  });

  test("usa un texto por defecto para códigos fuera de la tabla", () => {
    expect(weatherCodeLabel(1234)).toBe("Clima desconocido");
  });

  test("reporta 'Sin datos' cuando el código es null", () => {
    expect(weatherCodeLabel(null)).toBe("Sin datos");
  });
});
