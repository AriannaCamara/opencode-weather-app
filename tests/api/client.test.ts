import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockFetch } from "../helpers.ts";
import { fetchJson, WeatherError } from "../../src/api/client.ts";

afterEach(() => {
  mock.restore();
});

describe("WeatherError", () => {
  test("es un Error con nombre de dominio y causa encadenada", () => {
    const cause = new Error("boom");
    const error = new WeatherError("Fallo el clima.", { cause });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("WeatherError");
    expect(error.message).toBe("Fallo el clima.");
    expect(error.cause).toBe(cause);
  });
});

describe("fetchJson", () => {
  test("devuelve el JSON cuando la respuesta es OK", async () => {
    mockFetch(async () => new Response('{"hola":1}'));

    expect(await fetchJson("https://ejemplo.com/api", "el clima")).toEqual({ hola: 1 });
  });

  test("lanza WeatherError con el código de estado si la API responde con error", async () => {
    mockFetch(async () => new Response("fail", { status: 500 }));

    await expect(fetchJson("https://ejemplo.com/api", "el clima")).rejects.toThrow(WeatherError);
    await expect(fetchJson("https://ejemplo.com/api", "el clima")).rejects.toThrow(/500/);
  });

  test("lanza WeatherError si la red está caída", async () => {
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(fetchJson("https://ejemplo.com/api", "las coordenadas")).rejects.toThrow(
      /conexión a internet/,
    );
  });

  test("lanza WeatherError si el body no es JSON válido", async () => {
    mockFetch(async () => new Response("<html>no soy json</html>"));

    await expect(fetchJson("https://ejemplo.com/api", "el clima")).rejects.toThrow(/JSON válido/);
  });
});
