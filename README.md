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
