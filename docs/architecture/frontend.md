# Frontend Architecture: Feature-Sliced Design (FSD)

The entix-app web frontend follows a refined **Feature-Sliced Design (FSD)** methodology. This architecture is designed to enforce strict domain boundaries, improve scalability, and ensure the codebase remains maintainable as the product grows.

## 1. Core Principles

-   **Domain Encapsulation**: Domain-specific logic, components, and hooks are grouped into "Features".
-   **Strict Public API**: Features MUST only expose their functionality via a top-level `index.ts` file. External code should NEVER import from deep subdirectories of a feature.
-   **Unidirectional Data Flow**: Layers should follow a clear hierarchy (Pages -> Features -> Components/Shared) to avoid circular dependencies.

## 2. Directory Structure (`src/`)

| Layer | Purpose |
| :--- | :--- |
| `features/` | **Domain Modules**. Contains business logic and self-contained feature sets (e.g., Auth, Organization). |
| `components/` | **Generic UI**. Shared building blocks (e.g., `ui/Button`, `navigation/Sidebar`). These are "dumb" components with no domain knowledge. |
| `pages/` | **Routes/Views**. Composition of different features and layout components to build a complete view. |
| `hooks/` | **Shared Utility Hooks**. Generic logic like `useDebounce`, `useLocalStorage`, etc. |
| `lib/` | **Infrastructure**. Shared clients (e.g., `auth-client`, `api`). |
| `store/` | **Global State**. Only for state shared across the *entire* application (e.g., `themeAtom`). |

---

## 3. Anatomy of a Feature (`src/features/<name>/`)

Every feature follows a standardized internal structure:

```
src/features/auth/
├── components/      # UI components that belong ONLY to this domain.
├── hooks/           # Domain-specific business logic and TanStack Query hooks.
├── store/           # (Optional) Domain-specific atomic state (Jotai).
├── utils/           # (Optional) Helper functions unique to this domain.
├── constants/       # (Optional) Feature-specific configurations or enums.
└── index.ts         # The Public API. ONLY export what is needed externally.
```

### Why use this structure?
1.  **Refactoring Safety**: By only exposing a Public API (`index.ts`), you can refactor internal files (renaming, moving, splitting) without breaking consumers as long as the API remains stable.
2.  **Domain Ownership**: It’s clear who "owns" a piece of logic. If it’s in `features/billing`, it belongs to billing. 
3.  **Dependency Control**: It prevents "Spaghetti Code" by making it hard to accidentally import deep, internal logic from other domains.

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

Follow these steps when adding a new domain (e.g., `notifications`):

### Step 1: Scaffold the Directory
Create the base folder and the Public API file first.
```bash
mkdir -p src/features/notifications/{components,hooks}
touch src/features/notifications/index.ts
```

### Step 2: Define Feature Logic (`hooks/`)
Create hooks that handle API calls using TanStack Query. Keep them focused and decoupled from UI.
```typescript
// src/features/notifications/hooks/useNotifications.ts
export const useNotifications = () => {
    return useQuery({ 
       queryKey: ['notifications'], 
       queryFn: () => fetchNotifications() 
    });
};
```

### Step 3: Build Domain UI (`components/`)
Create components that use your domain hooks. Reuse generic building blocks from `src/components/ui` for styling.
```tsx
// src/features/notifications/components/NotificationList.tsx
import { List } from "antd"; // Generic UI
import { useNotifications } from "../hooks/useNotifications"; // Domain Logic

export const NotificationList = () => {
    const { data } = useNotifications();
    return <List dataSource={data} renderItem={...} />;
};
```

### Step 4: Expose the Public API (`index.ts`)
Only export the high-level components and hooks that pages or other features need.
```typescript
// src/features/notifications/index.ts
export * from "./components/NotificationList";
export * from "./hooks/useNotifications";
```

---

## 5. Layer Inter-dependency Rules

To maintain a clean architecture, follow these strict dependency rules:

1.  **Features cannot depend on Pages**.
2.  **Features can depend on other Features** ONLY via their Public APIs (`index.ts`).
3.  **Components (`src/components/`) cannot depend on Features**. They must remain "pure" and generic, receiving data via props.
4.  **Hooks (`src/hooks/`) cannot depend on Features**. They are for shared, generic logic.

## 6. Benefits

-   **SOLID Compliance**: Promotes Single Responsibility and Interface Segregation.
-   **Scalability**: New features don't clutter generic directories.
-   **Type Safety**: Centralized exports make it easier to track and refactor domain logic.
-   **Dev Speed**: Developers know exactly where to find and place code based on its domain.
