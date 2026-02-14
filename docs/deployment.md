# Deployment




## Environments

| Environment | Trigger | Command | Database |
|:---|:---|:---|:---|
| **Staging** | Automatic (PR) | `npm run deploy:staging` | `entix-app-staging` |
| **Production** | Manual | `npm run deploy:production` | `entix-app-production` |

### Staging (Preview)
- **Trigger**: Automatic on every Pull Request via Cloudflare GitHub Integration
- **Environment**: Uses `staging` environment in `wrangler.jsonc`
- **Isolation**: Separate D1 databases, KV namespaces, and R2 buckets

### Production
- **Trigger**: Manual deployment
- **Command**: `npm run deploy:production`
- **Process**: Applies migrations → Builds frontend → Deploys Worker with assets

### Environment Configuration
Defined in `wrangler.jsonc`:

```jsonc
"env": {
  "development": { ... },  // Local development
  "staging": { ... },      // Preview deployments
  "production": { ... }    // Production deployments
}
```

### Cloudflare Credentials
**Not required** for local development or CI/CD. Wrangler handles authentication implicitly.

---

## Build Configuration

### Cloudflare Dashboard Settings

Update your **Build & Deploy** settings in Cloudflare Dashboard:

**Build command**:
```bash
npm install && npm test && npm run build:web
```

*Order matters: Installs dependencies → Runs Tests → Builds Frontend.*

**Build output directory**:
```text
web/dist
```

**Root directory**:
```text
/
```

### Testing in CI

Tests run in the **Build Environment** during CI/CD:

- Tests verify code inside a simulated Cloudflare Worker environment (`workerd`) *before* deployment
- **Tests are ALWAYS ephemeral**, even when deploying to Staging
- They **NEVER** connect to live databases (`entix-app-staging` or `entix-app-production`)
- Tests use a fresh, empty database created just for testing, destroyed immediately after
- This ensures that a bad test cannot wipe or corrupt your staging/production data

**If tests fail**, the build is aborted and deployment does not proceed.

---

## Migration Strategy

### Manual Migrations (Recommended)

To avoid build failures due to permission issues, run migrations manually from your local terminal:

```bash
# Staging
npm run db:migrate:staging

# Production
npm run db:migrate:production
```

### Automated Migrations (Requires Setup)

If you want migrations to run automatically during deployment:

1. **Generate an API Token** in Cloudflare Dashboard with D1 Edit permissions
2. **Add token to environment variables** in your CI/CD or Cloudflare settings
3. **Deploy commands will run migrations**:
   - `npm run deploy:staging` → Runs `db:migrate:staging` + deploys
   - `npm run deploy:production` → Runs `db:migrate:production` + deploys

**Note**: Automated migrations in Cloudflare's build environment typically fail without proper API token configuration.

---

## Environment Variables

Ensure your Cloudflare Dashboard (Settings → Environment Variables) has:

- **`NODE_VERSION`**: `20`
- **`BETTER_AUTH_URL`**: Your production URL (e.g., `https://entix.org`)
- **`BETTER_AUTH_SECRET`**: At least 32 characters (set via secrets)
- **`FRONTEND_URL`**: Your frontend URL

Set secrets via Wrangler CLI:
```bash
# Staging
wrangler secret put BETTER_AUTH_SECRET --env staging

# Production
wrangler secret put BETTER_AUTH_SECRET --env production
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally (`npm test`)
- [ ] **Frontend built**: `npm run build:web` (CRITICAL - deploy script does NOT build automatically)
- [ ] Database migrations applied to staging
- [ ] Environment variables configured in Cloudflare Dashboard
- [ ] Staging deployment tested and verified
- [ ] Database backups in place (if applicable)

### Deploy to Production

> [!WARNING]
> The `deploy:production` script does **NOT** build the frontend automatically. You must run `npm run build:web` first, or Cloudflare will deploy whatever is currently in `web/dist/` (potentially stale assets).

**Correct deployment workflow**:
```bash
# 1. Build frontend (creates web/dist/)
npm run build:web

# 2. Deploy to production (migrates DB + deploys Worker)
npm run deploy:production
```

**What `deploy:production` does**:
1. Run database migrations (`db:migrate:production`)
2. Deploy Worker + assets from `web/dist/` to Cloudflare

If you deploy without building first, users will see old frontend code!

