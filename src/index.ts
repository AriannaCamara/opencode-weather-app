#!/usr/bin/env bun
import { runMenuLoop } from "./presentation/menu.ts";
import { createInput } from "./presentation/input.ts";
import type { Input } from "./presentation/input.ts";
import { loadStore, saveStore } from "./storage/citiesStorage.ts";

async function main(): Promise<void> {
  const store = await loadStore();
  const input = createInput();

  try {
    await runMenuLoop(store, input);
  } finally {
    input.close();
  }

  await saveStore(store);
}

await main();
