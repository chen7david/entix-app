# Entix-App Project

> **Welcome to the Entix-App Project!** 🚀
> 
> This repository is an open-source **example project** built to showcase and establish **best practices** for developers working within the modern **Cloudflare Ecosystem**. 
> 
> Designed with a strict Controller-Service-Repository architecture, it demonstrates how to build a high-performance, fully type-safe, and infinitely scalable full-stack monorepo at the edge using **Cloudflare Workers (Hono)**, **D1 (Drizzle ORM)**, **R2 Storage (Presigned URLs)**, and **React 19**.
>
🤝 *To the Community:* Learning and improving is a continuous process. If you spot a potential architectural improvement, a cleaner pattern, or a bug, **I invite you to open a Pull Request (PR)**! Contributions and discussions are highly appreciated.
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
