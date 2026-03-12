# Complete Feature Creation Guide

This guide provides a comprehensive, step-by-step walkthrough for building a new feature in the Entix-App ecosystem. It emphasizes our core architectural principles: **Controller-Service-Repository (CSR)**, **Dependency Injection (DI)**, and **Type-Safe OpenAPI Routing**.

---

## 1. Architectural Philosophy

### Why CSR and Factory Pattern?
We use a layered architecture to ensure **separation of concerns** and **testability**:

1.  **Handlers (Controller)**: Pure transport layer. Responsible for parsing HTTP requests, Zod validation, and returning JSON responses. They should never contain business logic.
2.  **Services**: The "Brain" of the app. Agnostic of the transport layer (Hono). They handle business logic, permissions, and orchestrate multiple repositories.
3.  **Repositories**: The data access layer. Encapsulate Drizzle ORM/D1 queries. They should be agnostic of business logic.
4.  **Factories**: The "Plumbing". Responsible for instantiating classes and injecting dependencies. This allows us to swap a "Real Repository" for a "Mock Repository" in tests easily.

---

## 2. Step-by-Step Implementation

Let's say we want to add a "Project" feature (an entity belonging to an Organization).

### Step 1: Database Schema & Migration
1.  Define the table in `api/db/schema.db.ts`:
    ```typescript
    export const project = sqliteTable("project", {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    });
    ```
2.  Generate the migration: `npm run db:generate`
3.  Apply locally: `npm run db:migrate:development`

### Step 2: Repository Layer
Create `api/repositories/project.repository.ts`. Notice it only depends on `AppDb`, not Hono context.

```typescript
export class ProjectRepository {
    constructor(private db: AppDb) {}

    async findByOrg(orgId: string) {
        return await this.db.query.project.findMany({
            where: eq(schema.project.organizationId, orgId),
        });
    }

    // Return a 'preparable' query for atomic batching (D1 Workaround)
    prepareCreate(id: string, name: string, orgId: string) {
        return this.db.insert(schema.project).values({
            id, name, organizationId: orgId, createdAt: new Date()
        });
    }
}
```

### Step 3: Service Layer
Create `api/services/project.service.ts`. It receives the Repository via the constructor.

```typescript
export class ProjectService {
    constructor(private projectRepo: ProjectRepository) {}

    async listProjects(orgId: string) {
        // Business logic or RBAC prefixing happens here
        return await this.projectRepo.findByOrg(orgId);
    }
}
```

### Step 4: Factory Setup
Add the new repository and service to the factories in `api/factories/`:

**`api/factories/repository.factory.ts`**:
```typescript
export const getProjectRepository = (ctx: AppContext) => 
    new ProjectRepository(getDbClient(ctx));
```

**`api/factories/service.factory.ts`**:
```typescript
export const getProjectService = (ctx: AppContext) => 
    new ProjectService(getProjectRepository(ctx));
```

### Step 5: OpenAPI Routes (Shared DTOs)
Define the contract in `api/routes/projects/projects.routes.ts`. Always use `@shared` schemas for consistency between frontend and backend.

```typescript
export const ProjectRoutes = {
    list: createRoute({
        method: "get",
        path: "/orgs/{organizationId}/projects",
        middleware: [requireAuth, requireOrgMembership],
        request: { params: z.object({ organizationId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: ProjectSchema.array() } },
                description: "List of projects",
            },
        },
    }),
};
```

### Step 6: Route Handler
Implement the final logic in `api/routes/projects/projects.handlers.ts`.

```typescript
export class ProjectHandler {
    static list: AppHandler<typeof ProjectRoutes.list> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const service = getProjectService(ctx); // Use the factory!
        const result = await service.listProjects(organizationId);
        return ctx.json(result, HttpStatusCodes.OK);
    };
}
```

---

## 3. Testing Strategy

Each feature requires two levels of verification:

### Unit Tests (`tests/unit/*.test.ts`)
*   **What**: Test the `Service` layer in isolation.
*   **How**: Mock the Repository. Since we use DI, you can simply pass a mock object to the Service constructor.
*   **Goal**: Verify business logic branches and error throws without hitting a real DB or network.

### Integration Tests (`tests/integration/*.test.ts`)
*   **What**: Test the full HTTP cycle (Request -> Middleware -> Handler -> DB).
*   **How**: Use `createTestClient`. These tests run in `@cloudflare/vitest-pool-workers`, providing a real Miniflare environment.
*   **Auth**: Use `getAuthCookie` helper to simulate logged-in users.

---

## 4. D1 Limitations & Batched Transactions

Cloudflare D1 is built on SQLite but does **not** support traditional `BEGIN TRANSACTION / COMMIT` over the wire in the same way Node/Postgres does. 

### The Workaround: `db.batch()`
To execute multiple queries atomically (e.g., creating a User and an Org), we use **Batching**:
1.  Repositories provide `prepare...` methods that return the `Insert/Update` statement object instead of calling `.execute()`.
2.  The Service collects these statements in an array.
3.  The Service calls `await db.batch([stmt1, stmt2])`.

This ensures that if `stmt2` fails, `stmt1` is never committed.

---

## 5. Included Packages & Justification

| Package | Purpose |
| :--- | :--- |
| **Hono** | Lightweight, Edge-ready router with excellent TypeScript inference. |
| **Drizzle ORM** | Type-safe SQL builder optimized for D1/SQLite. No heavy runtime. |
| **Better Auth** | Standardized authentication. Handles sessions/OAuth securely on the Edge. |
| **Zod** | Source of truth for all validation (I/O) and DTOs. |
| **TanStack Query** | Frontend state management. Replaces `useEffect` for data fetching. |
| **Jotai** | Atomic state for UI-only variables (modals, themes). |

---

## 6. Development Flow Reference

1.  **Request Flow**: `Route Definition -> Handler -> Factory -> Service -> Repository -> D1`.
2.  **Schema Updates**: Change `schema.db.ts` -> `npm run db:generate` -> `npm run db:migrate:development`.
3.  **Typegen**: If you change `wrangler.jsonc`, run `npm run cf-typegen` to update Worker bindings.
