# Why use .dev.vars?

Cloudflare Workers use `.dev.vars` for local secret management instead of `.env`.

## Reasons
1. **Compatibility**: It matches how Wrangler injects secrets into the local worker environment.
2. **Security**: Keeping it separate from public environment variables prevents accidental leakage.
3. **Miniflare Support**: Miniflare (the local simulator) looks for this file by default.

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
