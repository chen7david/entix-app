# Entix-App

A full-stack monorepo optimized for **Cloudflare Workers** (Hono) and **React 19**. Built for speed, type-safety, and scalability at the edge.

## Quick Start
```bash
npm run dev:init     # Install dependencies for both API and Web
npm run dev          # Start API and Web concurrently
```

## Documentation
📚 **[Browse the Full Documentation](https://entix.org/docs)**

### Key Guides:
- 🚀 [Quick Start Guide](./docs/index.md)
- 🛠 [Feature Creation Tutorial](./docs/features/create-new.md)
- 🧪 [Testing Strategy](./docs/testing/guide.md)
- ☁️ [Deployment Workflow](./docs/deployment/cloudflare.md)

## Core Rules
- **Git**: Always PR to `main` from feature branches.
- **Naming**: `camelCase` for vars, `PascalCase` for components, `kebab-case` for files/routes.
- **Security**: Use `AuthGuard` on frontend and `RBAC middleware` on backend.
- **Architecture**: Stick to the **Service-Repository** pattern for all business logic.

---
[Documentation Guide](./docs/how-to-write-docs.md) | [License: MIT](./LICENSE)
