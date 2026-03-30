# Create a New Feature

Follow these steps to add a new endpoint and logic to the app.

## 1. Schema Definition
Define your table in `shared/db/schema.db.ts`.
```typescript
export const todo = sqliteTable("todo", {
    id: text("id").primaryKey(),
    task: text("task").notNull(),
    completed: integer("completed", { mode: "boolean" }).default(false),
});
```

### 2. Create the Repository (Read/Write)
Repositories are "dumb": they only handle D1/Drizzle database access. They must not include business logic or throw `AppError` subclasses. Use `find*` naming; return `null` if not found.

```typescript
// repositories/financial/transaction.repository.ts
export class TransactionRepository {
    constructor(private db: AppDb) {}

    async findById(id: string): Promise<Transaction | null> {
        return await this.db.query.transactions.findFirst({
            where: eq(transactions.id, id),
        }) ?? null;
    }
}
```

### 3. Create the Service (Orchestration)
Services handle business logic and orchestration. They extend `BaseService` and provide `find*` (returns null) and `get*` (throws `NotFoundError`) methods.

```typescript
// services/financial/transaction.service.ts
export class TransactionService extends BaseService {
    constructor(private repo: TransactionRepository) {
        super();
    }

    async findTransaction(id: string) {
        return await this.repo.findById(id);
    }

    async getTransaction(id: string) {
        const tx = await this.findTransaction(id);
        return this.assertExists(tx, `Transaction ${id} not found`);
    }
}
```

### 4. Create the Factory (Dependency Injection)
Register your new repository and service in their respective factories. **Never inject external API clients (BetterAuth, Stripe) into Repositories.** Use the factories (or existing ones) to instantiate with dependencies.

```typescript
export const getTodoService = (c: Context) => {
    const db = getDbClient(c);
    const repo = new TodoRepository(db);
    return new TodoService(repo);
};
```

## 5. Handler & Route
Define the route in `api/routes/todo.routes.ts`. 

> [!IMPORTANT]
> **No Direct Repository Access (DRA)**: Handlers must **strictly** only interact with Services. Never call `getRepository` inside a route handler.

```typescript
const todoHandler = new AppOpenApi();
todoHandler.openapi(getTodoRoute, async (c) => {
    const service = getTodoService(c);
    const todo = await service.getTodo(c.req.param("id"));
    return c.json(todo, 200);
});
```

## 6. Frontend Navigation (Strict)
When building navigation on the Frontend (`web/src`), **never use hardcoded `/org/:slug/` routes**. 

Instead, strictly utilize the contextual `useOrgNavigate()` hook alongside the `AppRoutes` dictionary. This enforces Type Safety and natively handles dynamic multi-tenant routes for you!

```tsx
import { useOrgNavigate } from '@web/src/hooks/navigation/useOrgNavigate';
import { AppRoutes } from '@shared/constants/routes';

export const MyComponent = () => {
    // ❌ BAD: Hardcoding strings and manual React Router bindings
    // const navigate = useNavigate();
    // navigate(`/org/${slug}/playlists`);

    // ✅ GOOD: Abstracted context resolving the tenant universally
    const navigateOrg = useOrgNavigate();
    
    return (
        <Button onClick={() => navigateOrg(AppRoutes.org.manage.playlists)}>
            Go To Playlists
        </Button>
    )
}
```

[Why use the Service-Repository pattern?](../why/service-repository.md)

Last updated: Mar 30, 2026
[Back to Documentation Guide](../how-to-write-docs.md)
