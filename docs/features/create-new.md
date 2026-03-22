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

## 2. Repository Layer
Create `api/repositories/todo.repository.ts`. Encapsulate Drizzle queries.
```typescript
export class TodoRepository {
    constructor(private db: AppDb) {}
    async findAll() {
        return await this.db.select().from(schema.todo);
    }
}
```

## 3. Service Layer
Create `api/services/todo.service.ts`. Business logic lives here.
```typescript
export class TodoService {
    constructor(private repo: TodoRepository) {}
    async getTodos() {
        return await this.repo.findAll();
    }
}
```

## 4. Factory Function
Add a factory to `api/factories/todo.factory.ts` (or existing ones) to instantiate with dependencies.
```typescript
export const getTodoService = (c: Context) => {
    const db = getDbClient(c);
    const repo = new TodoRepository(db);
    return new TodoService(repo);
};
```

## 5. Handler & Route
Define the route in `api/routes/todo.routes.ts` using `@hono/zod-openapi`.
```typescript
const todoHandler = new AppOpenApi();
todoHandler.openapi(getTodosRoute, async (c) => {
    const service = getTodoService(c);
    const todos = await service.getTodos();
    return c.json(todos, 200);
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

Last updated: {Date: current}
[Back to Documentation Guide](../how-to-write-docs.md)
