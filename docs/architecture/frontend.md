# Frontend Architectural: Feature-Sliced Design (FSD)

The entix-app web frontend follows a refined **Feature-Sliced Design (FSD)** methodology. This architecture is designed to enforce strict domain boundaries, improve scalability, and ensure the codebase remains maintainable as the product grows.

## 1. Core Principles

-   **Domain Encapsulation**: Domain-specific logic, components, and hooks are grouped into "Features".
-   **Strict Public API**: Features MUST only expose their functionality via a top-level `index.ts` file. External code should NEVER import from deep subdirectories of a feature.
-   **Unidirectional Data Flow**: Layers should follow a clear hierarchy to avoid circular dependencies.

## 2. Directory Structure (`src/`)

| Layer | Purpose |
| :--- | :--- |
| `features/` | **Domain Modules**. Contains business logic and self-contained feature sets (e.g., Auth, Organization). |
| `components/` | **Generic UI**. Shared, cross-cutting building blocks (e.g., `ui/Button`, `navigation/Sidebar`). |
| `pages/` | **Routes**. Composition of features and layout to form a complete view. |
| `hooks/` | **Shared Hooks**. Non-domain specific logic (e.g., `useDebounce`). |
| `lib/` | **Infrastructure**. Shared clients (e.g., `auth-client`, `api`). |

---

## 3. Anatomy of a Feature (`src/features/<name>/`)

Every feature follows a standardized internal structure:

```
src/features/auth/
├── components/      # Feature-specific UI components
├── hooks/           # Business logic and TanStack Query hooks
├── store/           # (Optional) Atomic state (Jotai)
├── utils/           # (Optional) Helper functions unique to this domain
└── index.ts         # The Public API. ONLY export what is needed externally.
```

### The `index.ts` Rule
External code MUST import from the feature root:
```typescript
// ✅ Correct
import { useAuth } from "@web/src/features/auth";

// ❌ Incorrect (Violates FSD encapsulation)
import { useAuth } from "@web/src/features/auth/hooks/useAuth";
```

---

## 4. Developer Guide: Creating a New Feature

When adding a new domain (e.g., `billing`, `notifications`), follow these steps:

1.  **Scaffold**: Create `src/features/new-feature/` with `components/`, `hooks/`, and `index.ts`.
2.  **Logic First**: Implement TanStack Query hooks in `hooks/` using factory patterns (if applicable) or standard clients.
3.  **UI Construction**: Build required components in `components/`, reusing generic blocks from `src/components/ui`.
4.  **Export**: Export only the necessary high-level components and hooks in `index.ts`.
5.  **Implementation**: Import the feature into relevant files in `src/pages`.

---

## 5. Benefits

-   **SOLID Compliance**: Promotes Single Responsibility and Interface Segregation.
-   **Scalability**: New features don't clutter generic directories.
-   **Type Safety**: Centralized exports make it easier to track and refactor domain logic.
-   **Dev Speed**: Developers know exactly where to find and place code based on its domain.
