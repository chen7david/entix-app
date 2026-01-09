# Entix-App

Entix-App is a full-stack application built on **Cloudflare Workers** (API) and **Vite + React** (frontend).

## Documentation

The documentation has been split into multiple files for better organization:

- 🚀 **[Setup & Development](docs/setup.md)**
  - Quick Start
  - Environment Variables
  - Development Workflow
  - Scripts Reference

- 🏗️ **[Architecture & Structure](docs/architecture.md)**
  - System Architecture
  - Project Structure
  - Routing Pattern

- 🗄️ **[Database & Authentication](docs/database.md)**
  - Database Environments
  - Better Auth Setup
  - Schema & Migrations

- 🔌 **[API & Error Handling](docs/api.md)**
  - API Documentation Links
  - Error Handling
  - Validation Rules

- 🚀 **[Deployment](docs/deployment.md)**
  - Staging & Production
  - Environment Configuration

- 🔧 **[Troubleshooting](docs/troubleshooting.md)**
  - Common Issues & Solutions

- 📚 **[Documentation Guidelines](docs/documentation-guidelines.md)**
  - Best Practices
  - How to Contribute

---

## Documentation Deployment Proposal

To expose this documentation publicly, we recommend using **VitePress** deployed to **Cloudflare Pages**.

### Why VitePress?
- **Fast**: Built on Vite, instant server start.
- **Markdown-first**: Uses the exact structure we have created in `docs/`.
- **Customizable**: Easy to theme and extend with Vue components if needed.

### Deployment Strategy
Since we are already in the Cloudflare ecosystem:
1. **Initialize VitePress**: Run `npx vitepress init` in the `docs/` directory.
2. **Configure Cloudflare Pages**:
   - Connect the repository to a new Cloudflare Pages project.
   - **Build Command**: `npm run docs:build` (script to be added).
   - **Output Directory**: `docs/.vitepress/dist`.
3. **CI/CD**: Cloudflare Pages automatically deploys on every push to `main`.

This approach keeps the documentation close to the code while providing a professional, searchable, and performant documentation site.

---

## Tech Debt / TODO

This section tracks areas of the codebase that need attention, refactoring, or better documentation.

### Documentation Discrepancies
### Documentation Discrepancies
- [x] **Scripts**: The `package.json` contains `auth:generate` and `cf-typegen` scripts. These have been added to the "Scripts Reference" in `docs/setup.md`.
- [x] **API Routes**: Verified that `users` route follows the 3-file pattern. Future routes must strictly adhere to this.

### Code Quality & Refactoring
- [x] **Validation**: Verified that `shared/schemas/dto/user.dto.ts` correctly imports `z` from `@hono/zod-openapi`. This is crucial for OpenAPI generation.
- [x] **Hardcoded Paths**: Scanned `web/src` and found **zero** instances of hardcoded `localhost:3000` or `http://` URLs. All API calls should continue to use relative paths.

---

## Quick Links

- **Web**: [http://localhost:8000](http://localhost:8000)
- **API**: [http://localhost:3000](http://localhost:3000)
- **OpenAPI JSON**: [/api/v1/openapi](http://localhost:3000/api/v1/openapi)
- **API Reference**: [/api/v1/api-reference](http://localhost:3000/api/v1/api-reference)
