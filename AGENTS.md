# AGENTS.md

CLI de clima construida en Bun. La app funciona: `index.ts` es el entry point
(loop de menú + dispatch) y la lógica vive en `src/`. `README.md` es el spec
(en español). Los extras de la revisión viven en `ideas-revision.md`.

## Estructura

- `index.ts` — loop del menú, flujos por opción, manejo de errores.
- `src/api.ts` — HTTP a Open-Meteo (geocoding, clima actual y pronóstico 7 días)
  + parsers puros que lanzan `WeatherError`.
- `src/cities.ts` — lista de ciudades, default, toggle de unidad.
- `src/store.ts` — persistencia en `data/cities.json` (gitignored) con
  `Bun.file`/`Bun.write`.
- `src/ui.ts` — menú y renderizado (sin estado).
- `src/colors.ts` — paleta ANSI respetando `NO_COLOR`/`FORCE_COLOR`/TTY.
- `src/weatherCodes.ts` — código WMO → descripción en español.
- `src/guards.ts`, `src/types.ts`, `src/input.ts` — helpers compartidos.
- `*.test.ts` junto a cada módulo — tests de Bun.

## Runtime & tooling

- **Bun only** (v1.4.2, `bun.lock`). Never `npm`/`npx`/`yarn`/`pnpm`.
- Scripts en `package.json`: `build` (`bun build --compile index.ts --outfile
  weather`), `start` (`bun run index.ts`), `dev` (`--watch`). Para otro
  outfile/path (ej. `dist/weather.exe`) usá el comando directo.
- **No hay linter ni formatter.** `tsc` bajo `strict` es la única verificación
  automática: `bunx tsc` (TypeScript **7.0.2**, el port nativo Go). Exits
  non-zero ante cualquier error.
- Tests: `bun test` corre todos los `*.test.ts`; archivo solo:
  `bun test src/x.test.ts`; filtro por nombre: `bun test -t "nombre"`.

## tsconfig traps (todos activados, todos muerden)

`tsconfig.json` es estricto y no estándar:

- `verbatimModuleSyntax` — los imports de solo tipos **deben** usar
  `import type { X }`.
- `noUncheckedIndexedAccess` — `arr[0]` y `list.find()` son `T | undefined`;
  restringir antes de usar. Ojo con menús, listas y arrays de resultados.
- `noFallthroughCasesInSwitch` — el menú es un `switch`; cada case necesita
  `break`/`return`.
- `noImplicitOverride`, `strict` — miembros de subclases necesitan `override`.
- `noEmit: true` — `tsc` no compila; `bun build` es el único compilador.
- `"type": "module"` + `module: Preserve` + `moduleResolution: bundler` —
  solo ESM, sin `require`. `allowImportingTsExtensions` habilita `./foo.ts`.
- `noUnusedLocals`/`noUnusedParameters` son `false` — el código muerto no falla.

## Runtime APIs

`@types/bun` es la única fuente de tipos ambiente; preferir APIs nativas:

- Persistencia (default city, ciudades guardadas): `Bun.file` + `Bun.write`,
  no `fs`. `src/store.ts` ya usa `mkdir` de `node:fs/promises` para crear
  `data/` antes de guardar.
- HTTP con `fetch`; `Bun.sleep`, `Bun.$`, `Bun.serve` también disponibles.

## Conventions

- Identificadores, filenames y código en **English**.
- Comentarios y salida al usuario en **Spanish**.
- `README.md` + `ideas-revision.md` son la fuente de verdad del alcance: menú
  1–6, 8 (unidades), 9 (salir); default city, ciudades guardadas,
  agregar/eliminar/set-default, °C/°F y **opción 6 = pronóstico 7 días**
  (nueva, no está en el README todavía).
- API flow (sin key): geocoding primero
  (`https://geocoding-api.open-meteo.com/v1/search?name=...&count=1&language=es&format=json`),
  luego forecast con la lat/lon devuelta
  (`https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m`)
  o daily para 7 días (`daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&forecast_days=7`).
  `language=es` es deliberado.

## Repo state

- Rama actual: `02-forecast` (donde se está trabajando la opción 6). Existen
  también `main` y la rama con typo `02-forescast`.
- 4 commits, **sin git remote configurado** — nada que pushear/pullar.