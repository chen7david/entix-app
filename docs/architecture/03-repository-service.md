<!-- AI_CONTEXT -->
<!-- This document defines the definitive patterns for Data Access (Repository) and Business Logic (Service). -->

# Repository & Service Pattern

Entix-App enforces a strict separation between data access mechanics and business orchestration. This pattern ensures our code is testable, secure, and maintainable.

## Core Rules (Must Follow)

1.  **Dumb Repositories**: Repositories are ONLY responsible for database mechanics (querying, inserting, updating, deleting). They are "dumb"—they never make decisions about business logic.
2.  **No Logic in Repos**: Do not put authorization checks or complex workflows in a repository.
3.  **No Throws in Repos**: Repositories must return raw data or `null`. They must **NEVER** throw `AppError` subclasses like `NotFoundError`.
4.  **Service-Only Access**: Handlers (Hono) must **NEVER** call a repository directly. All database interaction must flow through a Service.
5.  **Service-Owned Errors**: Only the Service layer determines if a missing record constitutes a `NotFoundError`.
6.  **No External Leakage**: Repositories must not depend on external APIs (e.g., BetterAuth, Stripe). These dependencies belong in the Service layer.
7.  **Centralized IDs**: All id helpers live in **`shared/lib/id.ts`** (import `@shared`). Repositories must not import **`nanoid`**. Some tables use **`$defaultFn`** in Drizzle schema for simple inserts; services still mint ids explicitly for **`executeBatch` / `prepareInsert`** paths. See [ID generation](../conventions/02-id-generation).
8.  **No Raw DB in Services**: Services must never use the `db` client directly. They must use repositories for all persistence.

## The `find*` vs `get*` Protocol

To differentiate between "optional" and "required" data, we use a strict naming convention in the Service layer.

| Prefix | Behavior | Returned Type | Intent |
| :--- | :--- | :--- | :--- |
| **`find*`** | Nullable | `T | null` | "Look for this; it might not be there, and that's okay." |
| **`get*`** | Throwing | `T` (never null) | "This must exist; throw `NotFoundError` if it doesn't." |

### Implementation with `BaseService`

All domain services must extend `BaseService` to leverage the `assertExists` helper for enforcing the `get*` protocol.

```typescript
// Example: user.service.ts
import { BaseService } from "./base.service";

export class UserService extends BaseService {
    // find* returns null if not found (delegates to repo)
    async findUser(id: string) {
        return await this.userRepo.findUserById(id);
    }

    // get* uses assertExists to throw NotFoundError if null
    async getUser(id: string) {
        const user = await this.findUser(id);
        return this.assertExists(user, `User with ID ${id} not found`); 
    }
}
```

## 🏗 Wrong vs Right

| Aspect | ❌ Wrong (Avoid) | ✅ Right (Do) |
| :--- | :--- | :--- |
| **Logic** | Checking permissions in `UserRepository` | Checking permissions in `UserService` |
| **Exceptions** | Throwing `NotFoundError` in a repository | Throwing `NotFoundError` in a service |
| **Dependency** | Importing `BetterAuth` into a repository | Injecting `Auth` context into a service |
| **Access** | Handler calling a repository factory | Handler calling a service factory |
| **Persistence** | Service using `db.insert(...)` directly | Service calling `repo.insert(...)` |

## 🏷 Naming by Intent

- **Repository methods** are named after **data operations**: `findUserById`, `insertMember`, `updateOrganization`.
- **Service methods** are named after **business intent**: `inviteUser`, `transferOwnership`, `leaveOrganization`.

| Action | Repository Method | Service Method |
| :--- | :--- | :--- |
| Create a membership | `insertMember` | `addMember` (simple) or `inviteUser` (complex) |
| Remove an entity | `deletePlaylist` | `archivePlaylist` or `removePlaylist` |
| Update a state | `updateMember` | `changeRole` or `promoteUser` |

## Why This Pattern?

-   **Testability**: You can unit test Services by mocking simple Repository interfaces.
-   **Centralized Error Handling**: Standardized error messages and status codes (e.g., 404) are managed in one layer.
-   **Security**: RBAC checks are performed in the Service layer before calling the Repository, ensuring data is never accessed unauthorized.

---
Last updated: 2026-04-19
