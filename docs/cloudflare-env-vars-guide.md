# Environment Variables & Secrets Guide

In Cloudflare Workers, environment variables and secrets are handled differently than in standard Node.js applications. This guide explains the differences, precedence rules, and exactly where each variable in our project should be configured.

## ⚠️ Core Concept: Why variables get overwritten

When you run `wrangler deploy`, Wrangler uploads the configuration defined in your `wrangler.jsonc` file. 
**If you define a plain text variable in the Cloudflare Dashboard, but it is NOT in your `wrangler.jsonc`, the next deploy will overwrite/delete the dashboard variable.**

**However, Secrets are different.** Secrets are heavily encrypted and managed separately. `wrangler deploy` will **never** overwrite or delete secrets, but you cannot define secrets inside `wrangler.jsonc` (for security reasons).

### The Rule of Thumb:
- **Plain Text Configuration** (like URLs, bucket names) $\rightarrow$ Goes in `wrangler.jsonc`.
- **Secrets** (like API keys, passwords) $\rightarrow$ Configured via `wrangler secret put` or the Cloudflare Dashboard UI directly.
- **Local Development** $\rightarrow$ BOTH go into `.dev.vars` (which is never committed to Git).

---

## Complete Project Variable Audit

Below is the definitive list of variables used in this project and where they should be defined for **Staging** and **Production**.

### 1. Plain Text Variables (Define in `wrangler.jsonc`)
These are public or non-sensitive configuration values. They must be hardcoded under the `vars` block for each environment (`[env.production.vars]`) in your `wrangler.jsonc`.

| Variable Name | Purpose | Example / Note |
| --- | --- | --- |
| `FRONTEND_URL` | Used for CORS and email links. | `https://entix.org` |
| `BETTER_AUTH_URL` | The base URL for the auth server routes. | `https://entix.org` |
| `CORS_ORIGINS` | Allowed origins for the API. | `https://entix.org` |
| `R2_ACCOUNT_ID` | Cloudflare Account ID for routing the bucket. | `a90c...` |
| `R2_BUCKET_NAME` | The name of the specific environment's bucket. | `entix-app-production` |
| `PUBLIC_ASSET_URL` | The custom domain attached to the public bucket. | `https://cdn.entix.org` |
| `SKIP_EMAIL_VERIFICATION` | Optional flag to bypass email during testing. | `true` or empty |

*Action needed: If any of these are missing in `wrangler.jsonc` but present in your Cloudflare dashboard, they will be deleted on the next deploy. Add them to `wrangler.jsonc` immediately to fix the overwrite issue.*

---

### 2. Secrets (Define via Wrangler CLI or Cloudflare Dashboard)
These are highly sensitive. **Never put these in `wrangler.jsonc`**.

| Variable Name | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Cryptographic secret used to sign session tokens. |
| `RESEND_API_KEY` | API key for sending transactional emails. |
| `R2_ACCESS_KEY_ID` | S3-compatible Access Key for generating presigned URLs. |
| `R2_SECRET_ACCESS_KEY` | S3-compatible Secret Key for generation presigned URLs. |

**How to set secrets for Production:**
Run these commands in your terminal:
```bash
npx wrangler secret put BETTER_AUTH_SECRET --env production
npx wrangler secret put RESEND_API_KEY --env production
npx wrangler secret put R2_ACCESS_KEY_ID --env production
npx wrangler secret put R2_SECRET_ACCESS_KEY --env production
```
*(You will be prompted to paste the secret value after running each command).*

---

### 3. Local Development (`.dev.vars`)
When running `npm run dev` (which uses `wrangler dev`), Cloudflare automatically reads the `.dev.vars` file. 

This file should contain **both** Secrets and any specialized local overrides (e.g., local database mappings for Drizzle).

**Example `.dev.vars`:**
```env
# Required for running local scripts (like Drizzle migrations outside of Worker context)
CLOUDFLARE_D1_LOCAL_DB=.wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxx.sqlite

# Secrets
BETTER_AUTH_SECRET=super_secret_local_key
RESEND_API_KEY=re_xxxx...
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx

# Overrides (Optional, wrangler.jsonc usually handles these locally)
SKIP_EMAIL_VERIFICATION=true
```

## Summary Checklist to Fix the "Mess"
1. **Move all urls and bucket names into `wrangler.jsonc`**. When you deploy, Wrangler makes the Cloudflare Dashboard match `wrangler.jsonc`.
2. **Move all API keys and tokens into Secrets** via the Dashboard UI or `npx wrangler secret put`.
3. Check `.example.dev.vars` and ensure your local teammates know what to put in `.dev.vars`.
