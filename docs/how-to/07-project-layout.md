# Project layout

How the repo is organized and what must stay at the root for Cloudflare deploy.

## Top-level directories

| Path | Purpose |
|------|---------|
| `api/` | Hono Cloudflare Worker (routes, services, repositories, DB migrations) |
| `web/` | Vite React SPA — builds to `web/dist/` |
| `shared/` | Shared TypeScript (schemas, DTOs, DB schema) used by API and web |
| `tests/` | Integration, unit, and e2e tests run by `npm run test` |
| `api/tests/` | API unit tests with DB mocks (not in default vitest `include` yet) |
| `docs/` | VitePress documentation — builds into `web/dist/docs/` |
| `tooling/` | Vitest, Playwright, Drizzle, Better Auth configs |
| `scripts/` | Migration validation and deploy verification |

## Root files (deploy-critical)

| File | Why it stays at root |
|------|----------------------|
| `wrangler.jsonc` | Deploy entry; references `api/main.ts` and `web/dist` |
| `worker-configuration.d.ts` | Generated `CloudflareBindings` types — **required for deploy** |
| `package.json` | Install, dev, test, and `deploy:*` scripts |
| `biome.json` | Biome 2.x requires root config (cannot move to `tooling/`) |
| `tsconfig.json` | `@api` / `@shared` path aliases |

## Deploy flow

```bash
npm run dev:init          # once after clone
npm run build:web         # web/dist + web/dist/docs
npm run verify:deploy     # optional smoke check
npm run deploy:staging    # migrate + wrangler deploy
```

## Onboarding

```bash
git clone ...
cd entix-app
npm run dev:init
npm run dev
```

`dev:init` installs dependencies and runs `npm run dev:vars`, which creates `.dev.vars` from `.example.dev.vars` with generated secrets and (when available) auto-detected `CLOUDFLARE_D1_LOCAL_DB`.

To regenerate: `npm run dev:vars -- --force`

See also: [Incident reports](/incidents/) (in-repo: `tooling/README.md` at the repository root).
