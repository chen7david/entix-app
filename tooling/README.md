# Tooling configuration

Lint, test, and codegen configs live here so the repo root stays focused on deploy entrypoints.

## What stays at the repo root (do not move)

| File | Reason |
|------|--------|
| `wrangler.jsonc` | Cloudflare Workers deploy entry; paths reference `apps/api/`, `apps/web/dist` |
| `worker-configuration.d.ts` | Generated Wrangler types; **required for deploy and `CloudflareBindings`** |
| `package.json` / `package-lock.json` | Root install and deploy scripts |
| `tsconfig.json` | API + shared TypeScript; path aliases (`@api`, `@shared`) |
| `biome.json` | Lint/format (must stay at root — Biome 2.x rejects nested root configs) |

## Configs in this folder

| File | Used by |
|------|---------|
| `drizzle.config.ts` | `db:generate`, migration drift checks |
| `vitest.config.ts` | `npm run test:api` |
| `playwright.config.ts` | `npm run test:e2e` |
| `better-auth.config.ts` | `npm run auth:generate` |

All paths inside these files resolve from the **repo root**, not from `tooling/`.

## Lessons learned (avoid repeating)

1. **`apps/web/` is a separate npm package** — root `postinstall` runs `npm install --prefix apps/web` so Cloudflare CI (root `npm ci` only) gets React deps. Locally, `npm run dev:init` is still the one-shot setup (root install + `dev:vars`).
2. **Keep simple npm scripts** — no Turborepo or workspace orchestration; root `package.json` scripts are the source of truth.
3. **Biome config cannot move to `tooling/`** — use root `biome.json` only.
4. **React deploys via Workers Static Assets** — `wrangler.jsonc` → `./apps/web/dist`; no separate frontend Worker.
5. **`apps/api/tests/` consolidation deferred** — moving to `tests/api/` enabled 14 broken mock unit tests; fix mocks before including in vitest.
6. **`.dev.vars` is generated** — `npm run dev:vars` from `.example.dev.vars`; never commit secrets.
7. **Incident / AI notes** → `apps/docs/incidents/`, not repo root.
