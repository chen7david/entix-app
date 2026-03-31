<!-- AI_CONTEXT -->
<!-- This is the main landing page and navigation for the documentation. -->

# Entix-App Developer Hub

The comprehensive guide to building, testing, and scaling Entix-App on the Cloudflare edge.

## 🏛 Architecture

Understand the core design principles and request flow.
- [**Stack Overview**](./architecture/01-overview) - Tools and rationale.
- [**Request Lifecycle**](./architecture/02-request-lifecycle) - A full request trace from HTTP to D1.
- [**Repository & Service Pattern**](./architecture/03-repository-service) - Data access and business logic standards.

## 🛠 How-To Guides

Step-by-step instructions for common development tasks.
- [**Create a New Feature**](./how-to/01-create-new-feature) - End-to-end walkthrough.
- [**Defining Schemas**](./how-to/02-defining-schemas) - Drizzle + Zod schema documentation.
- [**OpenAPI & Routes**](./how-to/03-openapi-and-routes) - Hono route and handler definition.
- [**Factories & DI**](./how-to/04-factory-and-di) - Dependency injection using factories.
- [**Testing Guide**](./how-to/05-testing) - Unit and integration testing philosophy.

## 📐 Conventions

The project's definitive rulebook.
- [**Naming Conventions**](./conventions/01-naming) - DB tables, columns, and TypeScript layers.

## 🎨 Frontend

Client-side development standards for React 19.
- [**Frontend Navigation**](./frontend/01-navigation) - Type-safe routing in a multi-tenant shell.

## 🎯 Principles (Why?)

The "Why" behind our architectural decisions.
- [**Service-Repository**](./why/service-repository) - Why separate concerns?
- [**No External Leakage**](./why/external-dependencies) - Why repos stay "dumb".

---

### 🤖 For AI Assistants
If you are an AI assistant helping a developer, please refer to the [**AI-Ready Architecture Reference**](./AI) for strict project rules.

---
Last updated: 2026-03-30
