# Why test in Cloudflare's runtime?

We use `vitest-environment-cloudflare` to run tests inside the actual Workerd runtime.

## Reasons
1. **Behavioral Fidelity**: Local Node.js environments often behave differently than V8 Isolates (e.g., global APIs, Date handling).
2. **First-Class Bindings**: Direct access to actual D1, KV, and R2 bindings without complex mock injections.
3. **Speed**: Minimizes the gap between local development and edge deployment.

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
