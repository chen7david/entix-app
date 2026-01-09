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

---

## Tech Debt / TODO

This section tracks areas of the codebase that need attention, refactoring, or better documentation.

### Documentation Discrepancies
- [ ] **Scripts**: The `package.json` contains `auth:generate` and `cf-typegen` scripts which were not fully detailed in the original "Scripts Reference". Ensure their usage is clear in the new docs (added to `docs/setup.md` but might need more context).
- [ ] **API Routes**: While the `users` route follows the 3-file pattern, ensure all future routes strictly adhere to this to avoid drift.

### Code Quality & Refactoring
- [ ] **Validation**: Double-check that all new routes use `zod` validation in the `createRoute` definition to ensure type safety, as emphasized in the docs.
- [ ] **Hardcoded Paths**: Ensure no hardcoded URLs (like `http://localhost:3000`) exist in the frontend code; always use relative paths or environment variables.

---

## Quick Links

- **Web**: [http://localhost:8000](http://localhost:8000)
- **API**: [http://localhost:3000](http://localhost:3000)
- **OpenAPI JSON**: [/api/v1/openapi](http://localhost:3000/api/v1/openapi)
- **API Reference**: [/api/v1/api-reference](http://localhost:3000/api/v1/api-reference)
