<!-- AI_CONTEXT -->
<!-- This document outlines the core technology stack and the high-level request flow. -->

# Stack Overview

This project is built for maximum performance, type-safety, and global scale using a modern, edge-native stack.

## Core Technology Stack

| Tool | Role | Why? |
| :--- | :--- | :--- |
| **Hono** | HTTP Framework | Edge-native, zero-dependency, and built-in OpenAPI support. |
| **Cloudflare Workers** | Runtime | Global V8 isolates with ultra-low latency and zero cold starts. |
| **Drizzle ORM** | Data Access | High-performance SQL-like ORM with 1:1 TypeScript type safety. |
| **Zod** | Validation | Runtime and compile-time validation in a single schema. |
| **Better Auth** | Identity | Managed sessions and organization/RBAC logic that scales. |
| **Ant Design** | UI Framework | Enterprise-grade component library for rapid development. |
| **Tailwind CSS v4** | Styling | Utility-first styling with a modern, high-speed engine. |

## High-Level Request Flow

All requests follow a strict, unidirectional path to ensure predictability and ease of testing.

```text
  [ Client ] 
      │ 
      ▼ 
  [ Hono Router ] ──────────┐
      │                     │
      ▼                     │
  [ Route Handler ] <───────┤ (Zod Validation)
      │                     │
      ▼                     │
  [ Domain Service ] <──────┘ (Business Logic)
      │
      ▼
  [ Repository ] <─────────┐
      │                    │
      ▼                    │
  [ D1 Database ] ─────────┘ (SQLite Data)
```

## Layer Responsibilities

1.  **Handlers**: Parse parameters, enforce basic Hono middleware, and call Service factories.
2.  **Services**: The "Brain" of the app. Orchestrates multiple repositories, external APIs (Auth/Stripe), and enforces RBAC.
3.  **Repositories**: The "Dumb" data layer. Only knows how to query the database and return raw records or null.
4.  **D1**: The persistent storage layer running on Cloudflare's global network.

---
Last updated: 2026-03-30
