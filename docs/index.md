<!-- AI_CONTEXT -->
<!-- LAST_UPDATED: 2026-04-01 -->
<!-- VERSION: 1.2.0 -->
<!-- This is the main navigation hub for all Entix-App developer documentation. -->
<!-- For AI assistants: load API.md for backend rules, UI.md for frontend rules before generating any code. -->

# Entix-App Developer Hub

The comprehensive guide to building, testing, and scaling Entix-App on the Cloudflare edge.

---

## 🤖 For AI Assistants

Load these two documents **before generating any code**. They are mandatory context.

| Document | Scope | Purpose |
|---|---|---|
| [**API.md**](./API) | Backend | Architecture rules, naming, testing, error handling, response shapes |
| [**UI.md**](./UI) | Frontend | Component rules, design system, state management, accessibility |

All rules in both documents are MANDATORY. Violations are bugs, not style preferences.

---

## 🏛 Architecture

Understand the core design principles and request flow.
- [**Stack Overview**](./architecture/01-overview) — Tools, rationale, and technology decisions.
- [**Request Lifecycle**](./architecture/02-request-lifecycle) — Full request trace from HTTP to D1.
- [**Repository & Service Pattern**](./architecture/03-repository-service) — Data access and business logic standards.

---

## 🛠 How-To Guides

Step-by-step instructions for common development tasks.
- [**Create a New Feature**](./how-to/01-create-new-feature) — End-to-end walkthrough following the Rule 44 workflow.
- [**Defining Schemas**](./how-to/02-defining-schemas) — Drizzle + Zod schema documentation.
- [**OpenAPI & Routes**](./how-to/03-openapi-and-routes) — Hono route and handler definition.
- [**Factories & DI**](./how-to/04-factory-and-di) — Dependency injection using factory functions.
- [**Testing Guide**](./how-to/05-testing) — Unit and integration testing philosophy and patterns.

---

## 📐 Conventions

The project's definitive rulebook.
- [**API.md — Backend Rules**](./API) — Architecture, naming, error handling, testing, response standards.
- [**UI.md — Frontend Rules**](./UI) — Component architecture, design system, state, accessibility.
- [**Naming Conventions**](./conventions/01-naming) — DB tables, columns, and TypeScript layer naming.
- [**ID generation**](./conventions/02-id-generation) — Centralized `nanoid` helpers in `shared/lib/id.ts`.

---

## 🎨 Frontend

Client-side development standards for React 19 + Ant Design 6.
- [**UI.md — Frontend Architecture Reference**](./UI) — Full frontend rulebook.
- [**Frontend Navigation**](./frontend/01-navigation) — Type-safe routing in a multi-tenant shell.

---

## 🎯 Principles (Why?)

The reasoning behind our architectural decisions.
- [**Service-Repository**](./why/service-repository) — Why separate concerns across layers?
- [**No External Leakage**](./why/external-dependencies) — Why repositories stay dumb.

---

## 📋 Quick Reference

| Task | Go To |
|---|---|
| Add a new API feature | [API.md → Rule 44 Workflow](./API) |
| Write a service test | [API.md → Test Patterns](./API) |
| Build a new component | [UI.md → Rule 56 Split Conditions](./UI) |
| Handle a form | [UI.md → Rule 18 Form Zod Binding](./UI) |
| Add a new table | [UI.md → Rule 49 Responsive Tables](./UI) |
| Check naming | [API.md → Rule 5 Naming Standards](./API) |
| Error handling | [API.md → Rule 13 AppError Usage](./API) |
| Accessibility check | [UI.md → Rule 55 Accessibility Checklist](./UI) |

---

*Entix-App Developer Hub*
*Version: 1.2.0 (Last Updated: 2026-04-01)*