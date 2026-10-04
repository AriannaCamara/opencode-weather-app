# AGENTS.md

Fresh `bun init` scaffold. The app does not exist yet — `index.ts` is still
`console.log("Hello via Bun!")`. `README.md` is the spec (written in Spanish).

## Runtime & tooling

- **Bun only** (v1.4.2, `bun.lock`). Never `npm`/`npx`/`yarn`/`pnpm`.
- **`package.json` has zero scripts.** There is no `bun run test`, `lint`, or
  `build`. Run raw commands until you add scripts.
- **No linter or formatter is configured.** Don't assume eslint/prettier.
  `tsc` under `strict` is the only automated check.
- Typecheck: `bunx tsc` (TypeScript **7.0.2**, the native Go port — not TS 5.x).
  Verified working; exits non-zero on any error.
- Tests: Bun's built-in Jest-compatible runner, `bun test`. No test files exist
  yet, so it exits 1 with "0 test files" — pass `--pass-with-no-tests` if you
  wrap it in a script. Single file: `bun test src/x.test.ts`; filter by name:
  `bun test -t "nombre"`.
- Build the executable the README asks for:
  `bun build --compile --outfile dist/weather.exe index.ts` (Windows). `dist`
  and `out` are gitignored, so build artifacts won't be committed.

## tsconfig traps (all enabled, all will bite)

`tsconfig.json` is strict and non-default in ways that break naive code:

- `verbatimModuleSyntax` — type-only imports **must** use `import type { X }`.
- `noUncheckedIndexedAccess` — `arr[0]` and `list.find()` are `T | undefined`;
  narrow before use. Expect failures on any menu/list/result-array code.
- `noFallthroughCasesInSwitch` — the README's numbered menu is a `switch`;
  every case needs `break`/`return`.
- `noImplicitOverride`, `strict` — subclass members need `override`.
- `noEmit: true` — `tsc` cannot build; `bun build` is the only compiler.
- `"type": "module"` + `module: Preserve` + `moduleResolution: bundler` —
  ESM only, no `require`. `allowImportingTsExtensions` permits `./foo.ts`.
- `noUnusedLocals`/`noUnusedParameters` are `false` — dead code won't be flagged.

## Runtime APIs

`@types/bun` is the only ambient type source, so prefer Bun-native APIs:

- Persistence (default city, saved city list): `Bun.file` + `Bun.write`, not `fs`.
- Use `fetch` for HTTP; `Bun.sleep`, `Bun.$`, `Bun.serve` are also available.

## Conventions

- Identifiers, filenames, and code in **English**.
- Comments and user-facing output in **Spanish** (matching the README/spec).
- `README.md` is the source of truth for scope: menu options 1–5, 8 (units), 9
  (exit), default city, saved cities, add/remove/set-default, °C setting.
- API flow (no key required): geocoding first
  (`https://geocoding-api.open-meteo.com/v1/search?name=...&count=1&language=es&format=json`),
  then forecast with the returned lat/lon
  (`https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m`).
  `language=es` is deliberate.

## Repo state

- Branch `main`, single commit, **no git remote configured** — nothing to pull or push.