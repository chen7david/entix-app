## Seed Procedure

Seeds are one-time per environment. Never run in CI or on every deploy.

### Local dev (run any time you reset)

`npm run db:reset:dev`

### Staging D1 (first-time setup only)

`npm run db:seed:staging`

### Production D1 (first-time setup only)

`npm run db:seed:production`

Never re-run `db:seed:staging` or `db:seed:production` on a populated DB.
`INSERT OR IGNORE` protects against corruption, but seeds are provisioning, not deployment.
Migrations run automatically on every push via the Cloudflare GitHub integration.
Preview URLs share staging D1, so seeds are already applied from staging first setup.
