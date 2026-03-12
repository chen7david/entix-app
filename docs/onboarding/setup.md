# Environment Setup

How to configure your local environment for development.

## 1. Prerequisites
- **Node.js**: v20+
- **Wrangler CLI**: `npm install -g wrangler`

## 2. Secrets & Variables
We use `.dev.vars` for local secrets.

1. Copy the example:
   ```bash
   cp .dev.vars.example .dev.vars
1. Fill in the values:
   - `BETTER_AUTH_SECRET`: Generate a random string.
   - `RESEND_API_KEY`: Get from Resend dashboard.
   - `CLOUDFLARE_D1_LOCAL_DB`: Name of your local dev DB.

## 3. Database Initialization
Local D1 state is stored in `.wrangler/`. To reset it:
```bash
rm -rf .wrangler/state/v3/d1
```

[Why use .dev.vars?](../why/dev-vars.md)

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
