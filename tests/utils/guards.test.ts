import { describe, expect, test } from "bun:test";
import { asNumber, asString, isRecord } from "../../src/utils/guards.ts";

describe("isRecord", () => {
  test("acepta objetos planos y de clase", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(new Date())).toBe(true);
  });

  test("rechaza null, primitivos y undefined", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord("texto")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });

  test("los arrays pasan como registros (limitación documentada)", () => {
    expect(isRecord([])).toBe(true);
    expect(isRecord([1, 2])).toBe(true);
  });
});

describe("asString", () => {
  test("devuelve el string tal cual", () => {
    expect(asString("hola")).toBe("hola");
    expect(asString("")).toBe("");
  });

  test("devuelve null para todo lo que no sea string", () => {
    expect(asString(42)).toBeNull();
    expect(asString(null)).toBeNull();
    expect(asString(undefined)).toBeNull();
    expect(asString({})).toBeNull();
  });
});

describe("asNumber", () => {
  test("devuelve números fineros, incluidos negativos y cero", () => {
    expect(asNumber(0)).toBe(0);
    expect(asNumber(10.8)).toBe(10.8);
    expect(asNumber(-12.3)).toBe(-12.3);
  });

  test("devuelve null para NaN e infinito", () => {
    expect(asNumber(Number.NaN)).toBeNull();
    expect(asNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(asNumber(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  test("devuelve null para strings numéricos y otros tipos", () => {
    expect(asNumber("42")).toBeNull();
    expect(asNumber(null)).toBeNull();
    expect(asNumber(true)).toBeNull();
  });
});
