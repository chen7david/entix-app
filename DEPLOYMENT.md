# Deployment & Staging Guide

## Testing in Staging
Our tests (Vitest) run in the **Build Environment** (CI). They verify your code inside a simulated Cloudflare Worker environment (`workerd`) *before* it is deployed. 
- **They do NOT run against the live Staging database.**
- They use isolated, temporary databases.
- If tests fail, the build is cancelled, protecting your environment.

## Cloudflare Dashboard Settings
Update your **Build & Deploy** settings to the following:

### Build Configuration

**Build command**:
```bash
npm install && npm test && npm run build:web
```
*Order matters: Installs dependencies -> Runs Tests -> Builds Frontend.*

**Build output directory**:
```text
web/dist
```

**Root directory**:
```text
/
```

### Deploy & Version Commands (If using Workers Builds)
If you are seeing "Deploy command" and "Version command" fields, configure them as follows, but **be aware of migration risks**.

**Deploy command** (Production):
```bash
npm run deploy:production
```
*Note: This script attempts to run `db:migrate:production`. This typically FAILS in Cloudflare's build environment unless you have an API Token with D1 Edit permissions. If it fails, remove the migration step from the script or run migrations manually.*

**Version command** (Staging/Preview):
```bash
npm run deploy:staging
```
*Similarly, this runs `db:migrate:staging`.*

### Manual Migration Recommended
To avoid build failures due to permission issues, we recommend running migrations manually from your local terminal:
```bash
npm run db:migrate:staging
npm run db:migrate:production
```

## Environment Variables
Ensure your Cloudflare Dashboard (Settings > Environment Variables) has:
- `NODE_VERSION`: `20`
