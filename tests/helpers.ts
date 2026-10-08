import { spyOn } from "bun:test";
import type { Mock } from "bun:test";
import type { Input } from "../src/presentation/input.ts";
import type { City } from "../src/types/City.ts";

// spyOn(globalThis, "fetch") exige un mock con las propiedades estáticas de fetch
// (preconnect); el cast se hace una sola vez acá y no en cada test.
export function mockFetch(handler: (url: string) => Promise<Response>): Mock<typeof fetch> {
  const implementation = ((input: Parameters<typeof fetch>[0]) => handler(String(input))) as typeof fetch;
  return spyOn(globalThis, "fetch").mockImplementation(implementation);
}

export const OTTAWA: City = {
  id: 6094817,
  name: "Ottawa",
  country: "Canadá",
  region: "Ontario",
  latitude: 45.41117,
  longitude: -75.69812,
};

export const BARCELONA: City = {
  id: 3128760,
  name: "Barcelona",
  country: "España",
  region: "Cataluña",
  latitude: 41.389,
  longitude: 2.157,
};

export function makeCity(id: number, overrides: Partial<City> = {}): City {
  return {
    id,
    name: `Ciudad ${id}`,
    country: "Argentina",
    region: "Buenos Aires",
    latitude: -34.6,
    longitude: -58.38,
    ...overrides,
  };
}

export function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function currentPayload(temperature = 10.8): Record<string, unknown> {
  return {
    current_units: { temperature_2m: "°C" },
    current: { time: "2026-10-05T16:45", temperature_2m: temperature },
  };
}

export function dailyPayload(dayCount = 7): Record<string, unknown> {
  const time = Array.from({ length: dayCount }, (_, index) => `2026-10-${String(index + 6).padStart(2, "0")}`);
  return {
    daily_units: { temperature_2m_max: "°C" },
    daily: {
      time,
      temperature_2m_max: time.map(() => 21.4),
      temperature_2m_min: time.map(() => 12.1),
      precipitation_probability_max: time.map(() => 30),
      weathercode: time.map(() => 1),
    },
  };
}

export interface FakeInput extends Input {
  asked: string[];
}

// Input falso: responde con la cola de respuestas; al agotarse devuelve null (EOF).
export function fakeInput(...answers: (string | null)[]): FakeInput {
  const queue = [...answers];
  const asked: string[] = [];

  return {
    asked,
    async ask(question: string): Promise<string | null> {
      asked.push(question);
      return queue.shift() ?? null;
    },
    close(): void {},
  };
}

export function stripAnsi(text: string): string {
  return text.replace(/\u001B\[\d+m/g, "");
}

export interface ConsoleCapture {
  logs: string[];
  errors: string[];
  readonly logText: string;
  readonly errorText: string;
}

export function captureConsole(): ConsoleCapture {
  const logs: string[] = [];
  const errors: string[] = [];

  spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  });
  spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(" "));
  });

  return {
    logs,
    errors,
    get logText(): string {
      return stripAnsi(logs.join("\n"));
    },
    get errorText(): string {
      return stripAnsi(errors.join("\n"));
    },
  };
}
