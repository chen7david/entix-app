# Repository-Service Pattern

This project enforces a strict separation between data access and business logic.

## Why?

- **Separation of Concerns**: The Repository doesn't need to know if a "not found" result is a 404 error or a valid empty state for a specific business flow.
- **Testability**: Services are easier to test with mocked repositories when repositories have simple, predictable signatures (`null` vs `Data`).
- **Security**: Centralizing database access behind the Service layer ensures that authorization checks (`RBAC`) cannot be bypassed by a handler.

## Core Rules

1.  **Dumb Repositories**: Repositories must be "dumb". They are responsible ONLY for database mechanics (querying, inserting, updating).
2.  **No Logic in Repos**: Repositories should NEVER contain business logic or make decisions about what constitutes an error.
3.  **No Throws in Repos**: Repositories should return raw data or `null`. They must not throw `AppError` subclasses.
4.  **Service-Only Access**: Repositories are private to the Service layer. Controllers (Hono Handlers) must **NEVER** call a repository directly.
5.  **Service-Owned Errors**: Logic for missing records, authorization checks, and validation belongs in the Service layer.
6.  **No External Leakage**: Repositories must not depend on external APIs (e.g., BetterAuth, Stripe). Orchestration with external systems belongs in the Service layer.
7.  **No Raw DB in Services**: Services must **never** import or use `db` directly. All database access must flow through a repository.

## Naming Convention: find vs get

We maintain a strict naming distinction to make the developer's intent clear regarding record existence.

### **find* (Optional)**
- **Used in**: Both Repositories and Services.
- **Behavior**: Returns `T | null`.
- **Intent**: "Look for this record; it might not be there, and that's okay."

### **get* (Required)**
- **Used in**: Services ONLY.
- **Behavior**: Returns `T` or throws `NotFoundError`.
- **Intent**: "The system depends on this record existing; if it doesn't, it's a failure."

## Data Integrity: null vs undefined

- **null**: Represents the **intentional absence** of a value (e.g., a database query that returns no rows). Use `null` for all "not found" states.
- **undefined**: Reserved for uninitialized variables. Avoid using `undefined` to represent "not found" in repositories.

## Implementation Helpers

### BaseService
All domain services should extend `BaseService` to access the `assertExists` helper.

```typescript
// services/user.service.ts
async getUserById(id: string) {
    const user = await this.userRepo.findUserById(id);
    return this.assertExists(user, `User ${id} not found`); // ✅ Throws NotFoundError
}
```

## Example implementation ... (updated)
