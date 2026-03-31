# Entix-App Project

> **Welcome to the Entix-App Project!** 🚀
> 
> This repository is an open-source **example project** built to showcase and establish **best practices** for developers working within the modern **Cloudflare Ecosystem**. 
> 
> Designed with a strict Controller-Service-Repository architecture, it demonstrates how to build a high-performance, fully type-safe, and infinitely scalable full-stack monorepo at the edge using **Cloudflare Workers (Hono)**, **D1 (Drizzle ORM)**, **R2 Storage (Presigned URLs)**, and **React 19**.

## Quick Start
```bash
git clone https://github.com/chen7david/entix-app
cd entix-app
npm run dev:init     # Install dependencies for both API and Web
cp .example.dev.vars .dev.vars
npm run dev          # Start API and Web concurrently
```

## Documentation & API Reference
📚 **[Browse the Full Documentation](https://entix.org/docs)**
📡 **[OpenAPI / Swagger UI Reference](https://api.entix.org/docs)**

### Key Entry Points:
- 🚀 [Developer Onboarding](./docs/index.md)
- 🏗 [Architecture Overview](./docs/architecture/01-overview.md)
- 📐 [Naming Conventions](./docs/conventions/01-naming.md)

🤝 *To the Community:* Learning and improving is a continuous process. If you spot a potential architectural improvement, a cleaner pattern, or a bug, **I invite you to open a Pull Request (PR)**! Contributions and discussions are highly appreciated.

---
[License: MIT](./LICENSE)
