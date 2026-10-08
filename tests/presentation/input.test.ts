import { describe, expect, test } from "bun:test";
import { isAffirmative } from "../../src/presentation/input.ts";

describe("isAffirmative", () => {
  test("acepta s, si y sí en cualquier combinación de mayúsculas", () => {
    expect(isAffirmative("s")).toBe(true);
    expect(isAffirmative("S")).toBe(true);
    expect(isAffirmative("si")).toBe(true);
    expect(isAffirmative("SI")).toBe(true);
    expect(isAffirmative("sí")).toBe(true);
    expect(isAffirmative("Sí")).toBe(true);
  });

  test("ignora espacios alrededor de la respuesta", () => {
    expect(isAffirmative("  si  ")).toBe(true);
    expect(isAffirmative("\ts\n")).toBe(true);
  });

  test("rechaza todo lo que no sea una confirmación", () => {
    expect(isAffirmative("no")).toBe(false);
    expect(isAffirmative("n")).toBe(false);
    expect(isAffirmative("x")).toBe(false);
    expect(isAffirmative("")).toBe(false);
    expect(isAffirmative("sii")).toBe(false);
  });
});
